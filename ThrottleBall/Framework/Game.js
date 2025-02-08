"use strict";

import {g_app, SCREEN_SIZE_Y, WORLD_SIZE_X, WORLD_SIZE_Y} from "/ThrottleBall/Framework/GameCommon.js";
import Car from "/ThrottleBall/Gameplay/Car.js";
import PlayerController from "/ThrottleBall/Gameplay/PlayerController.js";

import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_debugRenderSystem,
    g_modelLoader, g_webXR, g_windowManager
} from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import * as FileUtils from "/Engine/Core/FileUtils.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";
import * as VideoUtils from "/Engine/Core/VideoUtils.js"

import { XboxButtonID } from "/Engine/Input/XboxController.js";
import AABB3 from "/Engine/Math/AABB3.js";
import EulerAngles from "/Engine/Math/EulerAngles.js";
import Mat44 from "/Engine/Math/Mat44.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vec4 from "/Engine/Math/Vec4.js";

import Camera from "/Engine/Renderer/Camera.js";
import { BlendMode, CullMode, DepthMode, g_aspect, VertexType } from "/Engine/Renderer/Renderer.js";


export class GameState
{
    static NONE = "NONE";
    static ATTRACT = "ATTRACT";
    static MENU = "MENU";
    static HOW_TO_PLAY = "HOW_TO_PLAY";
    static CREDITS = "CREDITS";
    static SETTINGS = "SETTINGS";
    static GAME = "GAME";
}

export default class Game
{
    constructor()
    {
        // Initialize world camera
        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetOrthoView(Vec2.ZERO, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y));
        // Initialize screen camera
        this.m_screenCamera = new Camera();

        this.m_clock = new Clock();

        // Load BitmapFont
        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/Sandbox/Data/Images/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });

        this.m_haveAssetsLoaded = false;

        this.m_state = GameState.GAME;
        this.m_nextState = GameState.NONE;

        this.SetGlobalRendererSettings();
        this.LoadAssets();

        this.m_cars = [];
        this.m_players = [];

        // Test PlayerController and Car
        this.m_players.push(new PlayerController(0));
        this.m_cars.push(new Car(this, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y).GetScaled(0.5), 0.0, this.m_players[0]));
        this.m_players[0].SetCar(this.m_cars[0]);

        document.getElementById("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });

        this.m_drawDebug = true;
    }

    HandleCanvasClicked()
    {
        g_input.SetCursorMode(true, true);
    }

    SetGlobalRendererSettings()
    {
        g_renderer.BindShader(null);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();
    }

    LoadAssets()
    {
        // Load Field Texture
        g_renderer.CreateOrGetTextureFromFile("/ThrottleBall/Data/Images/Field.png").then(texture =>
        {
            this.m_fieldTexture = texture;
            this.m_haveAssetsLoaded = true;
        })
    }

    Update(deltaSeconds)
    {
        for (let playerIndex = 0; playerIndex < this.m_players.length; playerIndex++)
        {
            this.m_players[playerIndex].HandleInput();
        }

        for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
        {
            this.m_cars[carIndex].Update();
        }

        if (g_input.WasKeyJustPressed("F1"))
        {
            this.m_drawDebug = !this.m_drawDebug;
        }
    }

    ClearScreen()
    {
        switch (this.m_state)
        {
            case GameState.NONE:
            case GameState.ATTRACT:
            case GameState.MENU:
            case GameState.CREDITS:
            case GameState.SETTINGS:
            {
                g_renderer.ClearScreen(Rgba8.GRAY);
                break;
            }
            case GameState.GAME:
            {
                g_renderer.ClearScreen(Rgba8.DEEP_SKY_BLUE);
            }
        }
    }

    Render()
    {
        if (!this.m_haveAssetsLoaded)
        {
            return;
        }

        g_renderer.BeginCamera(this.m_worldCamera);
        {
            // const fieldBackgroundVerts = [];
            // VertexUtils.AddPCUVertsForAABB2(fieldBackgroundVerts, this.m_worldCamera.GetOrthoBounds());
            // g_renderer.SetBlendMode(BlendMode.ALPHA);
            // g_renderer.BindTexture(this.m_fieldTexture);
            // g_renderer.DrawVertexArray(fieldBackgroundVerts);

            const fieldColor = new Rgba8(126, 217, 87);
            const fieldVerts = [];
            const fieldCenter = new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y).GetScaled(0.5);

            // Background
            VertexUtils.AddPCUVertsForAABB2(fieldVerts, this.m_worldCamera.GetOrthoBounds(), fieldColor);

            // Central Lines
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.5, 0.0), new Vec2(WORLD_SIZE_X * 0.5, WORLD_SIZE_Y), 0.25);
            VertexUtils.AddPCUVertsForRing2D(fieldVerts, fieldCenter, 15.0, 0.4);
            VertexUtils.AddPCUVertsForDisc2D(fieldVerts, fieldCenter, 1.0);

            // Left Penalty Area
            VertexUtils.AddPCUVertsForArc2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.1, WORLD_SIZE_Y * 0.5), WORLD_SIZE_X * 0.01 + 15.0, 0.4, -55, 55);
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(0.0, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.2), 0.25);
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(0.0, WORLD_SIZE_Y * 0.8), new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.8), 0.25);
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.15, WORLD_SIZE_Y * 0.8), 0.25);

            // Left Penalty Area
            VertexUtils.AddPCUVertsForArc2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.9, WORLD_SIZE_Y * 0.5), WORLD_SIZE_X * 0.01 + 15.0, 0.4, 125, 235);
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.2), 0.25);
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y * 0.8), new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.8), 0.25);
            VertexUtils.AddPCUVertsForLineSegment2D(fieldVerts, new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.2), new Vec2(WORLD_SIZE_X * 0.85, WORLD_SIZE_Y * 0.8), 0.25);

            g_renderer.BindTexture(null);
            g_renderer.DrawVertexArray(fieldVerts);

            for (let carIndex = 0; carIndex < this.m_cars.length; carIndex++)
            {
                this.m_cars[carIndex].Render();
            }
        }
        g_renderer.EndCamera(this.m_worldCamera);

        g_debugRenderSystem.RenderWorld(this.m_worldCamera);
        g_debugRenderSystem.RenderScreen(this.m_screenCamera);
    }
}