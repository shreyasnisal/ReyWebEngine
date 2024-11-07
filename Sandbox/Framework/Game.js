"use strict";

import { g_renderer, g_input } from "../../Sandbox/Framework/GameCommon.js";

import * as VertexUtils from "../../Engine/Core/VertexUtils.js";
import Rgba8 from "../../Engine/Core/Rgba8.js";
import AABB3 from "../../Engine/Math/AABB3.js";
import EulerAngles from "../../Engine/Math/EulerAngles.js";
import Mat44 from "../../Engine/Math/Mat44.js";
import Vec3 from "../../Engine/Math/Vec3.js";
import Camera from "../../Engine/Renderer/Camera.js";
import {CullMode, DepthMode, g_viewportHeight, g_viewportWidth} from "../../Engine/Renderer/Renderer.js";

export default class Game
{
    constructor()
    {
        // Initialize world camera
        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetRenderBasis(Vec3.SKYWARD, Vec3.WEST, Vec3.NORTH);
        this.m_worldCamera.SetTransform(new Vec3(0.0, 0.0, 0.0));

        // Create a test cube
        this.m_testCubeVertexes = [];
        const BLF = new Vec3(-0.5, 0.5, -0.5);
        const BRF = new Vec3(-0.5, -0.5, -0.5);
        const TRF = new Vec3(-0.5, -0.5, 0.5);
        const TLF = new Vec3(-0.5, 0.5, 0.5);
        const BLB = new Vec3(0.5, 0.5, -0.5);
        const BRB = new Vec3(0.5, -0.5, -0.5);
        const TRB = new Vec3(0.5, -0.5, 0.5);
        const TLB = new Vec3(0.5, 0.5, 0.5);
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BRB, BLB, TLB, TRB, Rgba8.RED); // back face (+X)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLF, BRF, TRF, TLF, Rgba8.CYAN); // front face (-X)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLB, BLF, TLF, TLB, Rgba8.LIME); // left face (+Y)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BRF, BRB, TRB, TRF, Rgba8.MAGENTA); // right face (-Y)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, TLF, TRF, TRB, TLB, Rgba8.BLUE); // top face (+Z)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLB, BRB, BRF, BLF, Rgba8.YELLOW); // bottom face (-Z)
        this.m_cubePosition = new Vec3(2.0, 0.0, 0.0);
        this.m_cubeOrientation = new EulerAngles(0.0, 0.0, 0.0);

        this.m_playerPosition = Vec3.ZERO;
        this.m_playerOrientation = EulerAngles.ZERO;

        this.InitializeGrid();
    }

    InitializeGrid()
    {
        this.m_gridStaticVerts = [];
        const lineHalfThickness = 0.01;
        const line5HalfThickness = 0.02;
        const line0HalfThickness = 0.04;

        for (let y = -50; y <= 50; y++)
        {
            VertexUtils.AddPCUVertsForAABB3(this.m_gridStaticVerts, new AABB3(new Vec3(-50.0, y - lineHalfThickness, -lineHalfThickness), new Vec3(50.0, y + lineHalfThickness, lineHalfThickness)), Rgba8.WHITE);
        }

        for (let x = -50; x <= 50; x++)
        {
            VertexUtils.AddPCUVertsForAABB3(this.m_gridStaticVerts, new AABB3(new Vec3(x - lineHalfThickness, -50.0, -lineHalfThickness), new Vec3(x + lineHalfThickness, 50.0, lineHalfThickness)), Rgba8.WHITE);
        }
    }

    Update(deltaSeconds)
    {
        this.m_cubeOrientation.m_yawDegrees += 45.0 * deltaSeconds;
        this.m_cubeOrientation.m_pitchDegrees += 30.0 * deltaSeconds;
        this.HandleInput(deltaSeconds);
        this.UpdateCameras();
    }

    HandleInput(deltaSeconds)
    {
        const MOVEMENT_SPEED = 4.0;

        const playerBasis = this.m_playerOrientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        if (g_input.IsKeyDown('W'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerFwd.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('A'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerLeft.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('S'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerFwd.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('D'.charCodeAt()))
        {
            this.m_playerPosition.Add(playerLeft.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('Q'.charCodeAt()))
        {
            this.m_playerPosition.Add(Vec3.GROUNDWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('E'.charCodeAt()))
        {
            this.m_playerPosition.Add(Vec3.SKYWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }

        this.m_playerOrientation.m_yawDegrees += g_input.GetCursorClientDelta().x * 0.15;
        this.m_playerOrientation.m_pitchDegrees -= g_input.GetCursorClientDelta().y * 0.15;

        if (g_input.WasLMBJustPressed())
        {
            g_input.SetCursorMode(true, true);
        }
    }

    UpdateCameras()
    {
        this.m_worldCamera.SetPerspectiveView(g_viewportWidth / g_viewportHeight, 90.0, 0.01, 100);
        this.m_worldCamera.SetTransform(this.m_playerPosition, this.m_playerOrientation);
    }

    Render()
    {
        const cubeTransform = Mat44.CreateTranslation3D(this.m_cubePosition);
        cubeTransform.Append(this.m_cubeOrientation.GetAsMatrix_iFwd_jLeft_kUp());

        g_renderer.BeginCamera(this.m_worldCamera);
        {
            g_renderer.ClearScreen(new Rgba8(0, 0, 0));
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.ENABLED);
            g_renderer.SetModelConstants(cubeTransform);
            g_renderer.DrawVertexArray(this.m_testCubeVertexes);
        }
        g_renderer.EndCamera(this.m_worldCamera);

        this.RenderGrid();
    }

    RenderGrid()
    {
        g_renderer.BeginCamera(this.m_worldCamera);
        {
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.ENABLED);
            g_renderer.SetModelConstants();
            g_renderer.DrawVertexArray(this.m_gridStaticVerts);
        }
        g_renderer.EndCamera(this.m_worldCamera);
    }
}