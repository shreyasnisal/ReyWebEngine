"use strict";

import {g_app, SCREEN_SIZE_Y, WORLD_SIZE_X, WORLD_SIZE_Y} from "/ThrottleBall/Framework/GameCommon.js";
import Car from "/ThrottleBall/Gameplay/Car.js";
import PlayerController from "/ThrottleBall/Gameplay/PlayerController.js";
import Map from "/ThrottleBall/Gameplay/Map.js";

import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_debugRenderSystem,
    g_modelLoader, g_webXR, g_windowManager
} from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import Rgba8 from "/Engine/Core/Rgba8.js";

import Vec2 from "/Engine/Math/Vec2.js";

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

        this.m_state = GameState.GAME;
        this.m_nextState = GameState.NONE;

        this.SetGlobalRendererSettings();
        this.LoadAssets();

        this.m_players = [];
        this.m_players.push(new PlayerController(0));
        this.m_players.push(new PlayerController(1));

        this.m_map = new Map(this);

        document.getElementById("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });
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
    }

    Update(deltaSeconds)
    {
        this.HandleDevCheats();

        for (let playerIndex = 0; playerIndex < this.m_players.length; playerIndex++)
        {
            this.m_players[playerIndex].HandleInput();
        }
        this.m_map.Update();
    }

    HandleDevCheats()
    {
        if (g_input.WasKeyJustPressed('P'))
        {
            this.m_clock.TogglePause();
        }
        if (g_input.WasKeyJustReleased('I'))
        {
            this.m_clock.SingleStepFrame();
        }
        if (g_input.IsKeyDown('O'))
        {
            this.m_clock.SingleStepFrame();
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
        g_renderer.BeginCamera(this.m_worldCamera);
        {
            this.m_map.Render();
        }
        g_renderer.EndCamera(this.m_worldCamera);

        g_debugRenderSystem.RenderWorld(this.m_worldCamera);
        g_debugRenderSystem.RenderScreen(this.m_screenCamera);
    }
}