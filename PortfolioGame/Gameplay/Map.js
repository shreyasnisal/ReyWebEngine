"use strict";

import {g_input, g_renderer} from "/Engine/Core/EngineCommon.js";
import PlayerPawn from "/PortfolioGame/Gameplay/PlayerPawn.js";
import StaticEntityDefinition from "/PortfolioGame/Gameplay/StaticEntityDefinition.js";
import StaticEntity from "/PortfolioGame/Gameplay/StaticEntity.js";

import CPUImage from "/Engine/Core/CPUImage.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Vertex_PCU from "/Engine/Core/Vertex_PCU.js";
import Vertex_PCUTBN from "/Engine/Core/Vertex_PCUTBN.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB3 from "/Engine/Math/AABB3.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";

import { BlendMode, CullMode, DepthMode, VertexType } from "/Engine/Renderer/Renderer.js";
import SpriteSheet from "/Engine/Renderer/SpriteSheet.js";


export default class Map
{
    constructor(game, imageFilePaths)
    {
        this.m_game = game;

        this.m_debugDrawEntityCollisions = false;

        this.m_totalMapImages = imageFilePaths.length;
        this.m_numImagesLoaded = 0;
        this.m_mapImages = [];

        this.m_tileBoundsList = [];
        this.m_staticEntities = [];

        this.LoadAssets(imageFilePaths);
    }

    LoadAssets(imageFilePaths)
    {
        this.m_diffuseShader = null;
        g_renderer.CreateOrGetShaderFromFiles("Diffuse", "/PortfolioGame/Data/Shaders/Diffuse_Vertex", "/PortfolioGame/Data/Shaders/Diffuse_Fragment", VertexType.VERTEX_PCUTBN).then(shader => {
            this.m_diffuseShader = shader;
        });

        this.m_tileSpriteSheet = null;
        g_renderer.CreateOrGetTextureFromFile("/PortfolioGame/Data/Images/TileSpriteSheet.png").then(texture => {
            this.m_tileSpriteSheet = new SpriteSheet(texture, new Vec2(5, 6));

            for (let imageFilePathIndex = 0; imageFilePathIndex < imageFilePaths.length; imageFilePathIndex++)
            {
                const mapImage = new CPUImage(imageFilePaths[imageFilePathIndex], (mapImage) => {
                    this.m_mapImages[imageFilePathIndex] = mapImage;
                    this.m_numImagesLoaded++;
                });
            }
        })
    }

    InitializeVertexBufferFromImages()
    {
        this.m_dimensions = new Vec2(this.m_mapImages[0].m_width, this.m_mapImages[0].m_height);

        const floorTileUVs = this.m_tileSpriteSheet.GetSpriteUVs(17);
        const wallTileUVs = this.m_tileSpriteSheet.GetSpriteUVs(2);
        const ceilingTileUVs = this.m_tileSpriteSheet.GetSpriteUVs(7);
        // const floorTint = new Rgba8(155, 81, 224);
        const floorTint = new Rgba8(165, 42, 42);
        // const wallTint = new Rgba8(127, 127, 127);
        const wallTint = new Rgba8(155, 81, 224);
        const ceilingTint = new Rgba8(0, 0, 0);

        const tileVertexes = [];
        for (let mapImageIndex = 0; mapImageIndex < this.m_mapImages.length; mapImageIndex++)
        {
            for (let tileIndex = 0; tileIndex < this.m_mapImages[mapImageIndex].m_texelData.length; tileIndex++) {
                if (!this.m_mapImages[mapImageIndex].m_texelData[tileIndex].Equals(Rgba8.RED))
                {
                    continue;
                }

                const tileCoords = this.GetTileCoordsFromIndex(tileIndex);

                // FLoor
                const BLF = new Vec3(tileCoords.x, tileCoords.y + 1.0, mapImageIndex - 1.0);
                const BRF = new Vec3(tileCoords.x, tileCoords.y, mapImageIndex - 1.0);
                const TRF = new Vec3(tileCoords.x, tileCoords.y, mapImageIndex);
                const TLF = new Vec3(tileCoords.x, tileCoords.y + 1.0, mapImageIndex);
                const BLB = new Vec3(tileCoords.x + 1.0, tileCoords.y + 1.0, mapImageIndex - 1.0);
                const BRB = new Vec3(tileCoords.x + 1.0, tileCoords.y, mapImageIndex - 1.0);
                const TRB = new Vec3(tileCoords.x + 1.0, tileCoords.y, mapImageIndex);
                const TLB = new Vec3(tileCoords.x + 1.0, tileCoords.y + 1.0, mapImageIndex);
                VertexUtils.AddPCUVertsForQuad3D(tileVertexes, BRB, BLB, TLB, TRB, wallTint, wallTileUVs); // back face (+X)
                VertexUtils.AddPCUVertsForQuad3D(tileVertexes, BLF, BRF, TRF, TLF, wallTint, wallTileUVs); // front face (-X)
                VertexUtils.AddPCUVertsForQuad3D(tileVertexes, BLB, BLF, TLF, TLB, wallTint, wallTileUVs); // left face (+Y)
                VertexUtils.AddPCUVertsForQuad3D(tileVertexes, BRF, BRB, TRB, TRF, wallTint, wallTileUVs); // right face (-Y)
                VertexUtils.AddPCUVertsForQuad3D(tileVertexes, TLF, TRF, TRB, TLB, floorTint, floorTileUVs); // top face (+Z)
                VertexUtils.AddPCUVertsForQuad3D(tileVertexes, BLB, BRB, BRF, BLF, ceilingTint, ceilingTileUVs); // bottom face (-Z)

                this.m_tileBoundsList.push(new AABB3(new Vec3(tileCoords.x, tileCoords.y, mapImageIndex - 1.0), new Vec3(tileCoords.x + 1.0, tileCoords.y + 1.0, mapImageIndex)));
            }
        }

        this.m_mapVBO = g_renderer.CreateVertexBuffer(tileVertexes.length * Vertex_PCUTBN.NUM_FLOAT32_ELEMENTS * 4, VertexType.VERTEX_PCU);
        g_renderer.CopyVertexBufferToGPU(tileVertexes, tileVertexes.length, this.m_mapVBO);

        this.InitializeStaticEntities();
    }

    InitializeStaticEntities()
    {
        for (let mapImageIndex = 0; mapImageIndex < this.m_mapImages.length; mapImageIndex++) {
            for (let tileIndex = 0; tileIndex < this.m_mapImages[mapImageIndex].m_texelData.length; tileIndex++) {
                const tileCoords = this.GetTileCoordsFromIndex(tileIndex);
                for (let staticEntityDefName in StaticEntityDefinition.s_staticEntityDefinitions) {
                    if (StaticEntityDefinition.s_staticEntityDefinitions[staticEntityDefName].m_mapImageColor.Equals(this.m_mapImages[mapImageIndex].m_texelData[tileIndex])) {
                        this.m_staticEntities.push(new StaticEntity(this, new Vec3(tileCoords.x, tileCoords.y, mapImageIndex - 1.0), StaticEntityDefinition.s_staticEntityDefinitions[staticEntityDefName]));
                    }
                }
            }
        }
    }

    Update()
    {
        if (this.m_mapVBO == null)
        {
            if (this.m_numImagesLoaded === this.m_totalMapImages)
            {
                this.InitializeVertexBufferFromImages();
            }
            return;
        }

        if (g_input.WasKeyJustPressed("F2"))
        {
            this.m_debugDrawEntityCollisions = !this.m_debugDrawEntityCollisions;
        }

        for (let staticEntityIndex = 0; staticEntityIndex < this.m_staticEntities.length; staticEntityIndex++)
        {
            this.m_staticEntities[staticEntityIndex].Update();
        }

        this.PushPlayerPawnOutOfStaticEntities();
        this.PushPlayerPawnOutOfTiles();
    }

    Render()
    {
        if (this.m_mapVBO == null)
        {
            return;
        }
        if (this.m_diffuseShader == null)
        {
            return;
        }

        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.OPAQUE);
        g_renderer.SetDepthMode(DepthMode.ENABLED);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(this.m_tileSpriteSheet.GetTexture());
        g_renderer.DrawVertexBuffer(this.m_mapVBO, this.m_mapVBO.m_size / (Vertex_PCU.NUM_FLOAT32_ELEMENTS * 4));

        g_renderer.BindShader(this.m_diffuseShader);
        g_renderer.SetLightConstants(this.m_game.m_sunDirection.GetNormalized(), this.m_game.m_sunIntensity, 1.0 - this.m_game.m_sunIntensity);
        for (let staticEntityIndex = 0; staticEntityIndex < this.m_staticEntities.length; staticEntityIndex++)
        {
            this.m_staticEntities[staticEntityIndex].Render();
        }
    }

    PushPlayerPawnOutOfStaticEntities()
    {
        if (this.m_staticEntities == null)
        {
            return;
        }

        for (let staticEntityIndex = 0; staticEntityIndex < this.m_staticEntities.length; staticEntityIndex++)
        {
            const pawnPositionBeforePush = new Vec3(this.m_game.m_player.m_pawn.m_position.x, this.m_game.m_player.m_pawn.m_position.y, this.m_game.m_player.m_pawn.m_position.z);
            if (MathUtils.PushZCylinderOutOfFixedAABB3(this.m_game.m_player.m_pawn.m_position, this.m_game.m_player.m_pawn.GetEyePosition(), PlayerPawn.RADIUS, this.m_staticEntities[staticEntityIndex].m_bounds))
            {
                if (pawnPositionBeforePush.z < this.m_game.m_player.m_pawn.m_position.z)
                {
                    this.m_game.m_player.m_pawn.m_isGrounded = true;
                    this.m_game.m_player.m_pawn.m_velocity.z = 0.0;
                }
            }
        }
    }

    PushPlayerPawnOutOfTiles()
    {
        if (this.m_tileBoundsList == null)
        {
            return;
        }

        for (let tileBoundsIndex = 0; tileBoundsIndex < this.m_tileBoundsList.length; tileBoundsIndex++)
        {
            const pawnPositionBeforePush = new Vec3(this.m_game.m_player.m_pawn.m_position.x, this.m_game.m_player.m_pawn.m_position.y, this.m_game.m_player.m_pawn.m_position.z);
            if (MathUtils.PushZCylinderOutOfFixedAABB3(this.m_game.m_player.m_pawn.m_position, this.m_game.m_player.m_pawn.GetEyePosition(), PlayerPawn.RADIUS, this.m_tileBoundsList[tileBoundsIndex]))
            {
                if (pawnPositionBeforePush.z < this.m_game.m_player.m_pawn.m_position.z)
                {
                    this.m_game.m_player.m_pawn.m_isGrounded = true;
                    this.m_game.m_player.m_pawn.m_velocity.z = 0.0;
                }
            }

        }
    }

    GetTileCoordsFromIndex(tileIndex)
    {
        return new Vec2(tileIndex % this.m_dimensions.x, Math.floor(tileIndex / this.m_dimensions.x));
    }

    GetTileIndexFromCoords(tileCoords)
    {
        return Math.floor(tileCoords.x) + Math.floor(tileCoords.y) * this.m_dimensions.x;
    }
}
