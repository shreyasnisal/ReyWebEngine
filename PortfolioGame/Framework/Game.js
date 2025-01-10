"use strict";

import {g_app, SCREEN_SIZE_Y} from "/PortfolioGame/Framework/GameCommon.js";
import Map from "/PortfolioGame/Gameplay/Map.js";
import Player from "/PortfolioGame/Gameplay/Player.js";
import StaticEntityDefinition from "/PortfolioGame/Gameplay/StaticEntityDefinition.js";

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
import CPUImage from "/Engine/Core/CPUImage.js";
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
    static INTRO = "INTRO";
    static ATTRACT = "ATTRACT";
    static GAME = "GAME";
}

export default class Game
{
    constructor()
    {
        this.m_state = GameState.GAME;

        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetRenderBasis(Vec3.SKYWARD, Vec3.WEST, Vec3.NORTH);
        this.m_worldCamera.SetTransform(new Vec3(0.0, 0.0, 0.0));
        this.m_screenCamera = new Camera();

        this.m_clock = new Clock();

        this.m_sunDirection = new Vec3(1.0, 2.0, -1.0);
        this.m_sunIntensity = 0.9;

        this.LoadAssets();

        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/PortfolioGame/Data/Images/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });

        this.m_player = new Player(this, new Vec3(5.0, 5.0, 2.0), new EulerAngles(0.0, 15.0, 0.0));
        this.m_map = new Map(this, [
            "/PortfolioGame/Data/Images/Map0.png",
            "/PortfolioGame/Data/Images/Map1.png",
            "/PortfolioGame/Data/Images/Map2.png",
            "/PortfolioGame/Data/Images/Map3.png",
            "/PortfolioGame/Data/Images/Map0.png" ]);

        document.getElementById("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });
    }

    HandleCanvasClicked()
    {
        if (g_webXR.IsVRSupported())
        {
            g_webXR.StartXRSession(g_app.RunFrame.bind(g_app));
        }
        else
        {
            g_input.SetCursorMode(true, true);
        }
    }

    LoadAssets()
    {
        StaticEntityDefinition.Initialize();
    }

    Update()
    {
        switch (this.m_state)
        {
            case GameState.INTRO:       this.UpdateIntro();         break;
            case GameState.ATTRACT:     this.UpdateAttract();       break;
            case GameState.GAME:       this.UpdateGame();          break;
        }

        this.UpdateCameras();
    }

    UpdateIntro()
    {

    }

    UpdateAttract()
    {

    }

    UpdateGame()
    {
        this.m_player.Update();
        this.m_map.Update();

        if (!this.m_player.m_isFreeFlyMode)
        {
            this.m_player.m_position = this.m_player.m_pawn.GetEyePosition();
            this.m_player.m_orientation = this.m_player.m_pawn.GetOrientation();
        }
    }

    UpdateCameras()
    {
        this.m_worldCamera.SetPerspectiveView(g_aspect, 90.0, 0.01, 100);
        this.m_worldCamera.SetTransform(this.m_player.m_position, this.m_player.m_orientation);
        this.m_screenCamera.SetOrthoView(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
    }

    Render()
    {
        switch (this.m_state)
        {
            case GameState.INTRO:       this.RenderIntro();         break;
            case GameState.ATTRACT:     this.RenderAttract();       break;
            case GameState.GAME:        this.RenderGame();          break;
        }

        g_renderer.BindShader(null);
        g_debugRenderSystem.RenderWorld(this.m_worldCamera);
        g_debugRenderSystem.RenderScreen(this.m_screenCamera);
    }

    RenderIntro()
    {

    }

    RenderAttract()
    {

    }

    RenderGame()
    {
        this.m_map.Render();
    }
}