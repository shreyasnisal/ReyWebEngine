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
    g_modelLoader,
    g_webXR,
    g_windowManager,
    g_audio
} from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js"
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";

import Camera from "/Engine/Renderer/Camera.js";
import { BlendMode, CullMode, DepthMode, g_aspect, VertexType } from "/Engine/Renderer/Renderer.js";

import * as DOM from "/Engine/Window/DomManager.js";

export class GameState
{
    static NONE = -1;
    static ATTRACT = 0;
    static MENU = 1;
    static HOW_TO_PLAY = 2;
    static CREDITS = 3;
    static SETTINGS = 4;
    static LOBBY = 5;
    static GAME = 6;
    static MATCH_END = 7;
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
        this.m_screenCamera.SetOrthoView(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));

        this.m_clock = new Clock();

        // Load BitmapFont
        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/Sandbox/Data/Images/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });

        this.m_transitionTimer = new Stopwatch(0.5, this.m_clock);
        this.m_state = GameState.NONE;
        this.m_nextState = GameState.LOBBY;

        this.m_players = [];
        this.m_map = null;

        this.SetGlobalRendererSettings();
        this.LoadAssets();

        DOM.GetElementByID("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });
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
        this.m_testSound = g_audio.CreateSound("/ThrottleBall/Data/Audio/TestSound.mp3");
    }

    FixedUpdate(deltaSeconds)
    {

    }

    Update()
    {
        this.HandleDevCheats();

        switch (this.m_state)
        {
            case GameState.ATTRACT:     this.Update_Attract();          break;
            case GameState.MENU:        this.Update_Menu();             break;
            case GameState.CREDITS:     this.Update_Credits();          break;
            case GameState.HOW_TO_PLAY: this.Update_HowToPlay();        break;
            case GameState.SETTINGS:    this.Update_Settings();         break;
            case GameState.LOBBY:       this.Update_Lobby();            break;
            case GameState.GAME:        this.Update_Game();             break;
            case GameState.MATCH_END:   this.Update_MatchEnd();         break;
        }

        this.HandleStateChange();
    }

    Update_Attract()
    {

    }

    Update_Menu()
    {

    }

    Update_Credits()
    {

    }

    Update_HowToPlay()
    {

    }

    Update_Settings()
    {

    }

    Update_Lobby()
    {
        if (g_input.WasKeyJustPressed("Space"))
        {
            this.m_nextState = GameState.GAME;
        }
    }

    Update_Game()
    {
        for (let playerIndex = 0; playerIndex < this.m_players.length; playerIndex++)
        {
            this.m_players[playerIndex].HandleMovementInput();
        }
        this.m_map.Update();
    }

    Update_MatchEnd()
    {

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
        if (g_input.WasKeyJustPressed('T'))
        {
            this.m_clock.SetTimeScale(0.1);
        }
        if (g_input.WasKeyJustReleased('T'))
        {
            this.m_clock.SetTimeScale(1.0);
        }

        if (g_input.WasKeyJustPressed('Y'))
        {
            g_audio.PlaySound(this.m_testSound);
        }
    }

    ClearScreen()
    {
        g_renderer.ClearScreen(Rgba8.DEEP_SKY_BLUE);
    }

    Render()
    {
        switch (this.m_state)
        {
            case GameState.ATTRACT:         this.Render_Attract();      break;
            case GameState.MENU:            this.Render_Menu();         break;
            case GameState.CREDITS:         this.Render_Credits();      break;
            case GameState.HOW_TO_PLAY:     this.Render_HowToPlay();    break;
            case GameState.SETTINGS:        this.Render_Settings();     break;
            case GameState.LOBBY:           this.Render_Lobby();        break;
            case GameState.GAME:            this.Render_Game();         break;
            case GameState.MATCH_END:       this.Render_MatchEnd();     break;
        }

        this.RenderIntroTransition();
        this.RenderOutroTransition();

        g_debugRenderSystem.RenderWorld(this.m_worldCamera);
        g_debugRenderSystem.RenderScreen(this.m_screenCamera);
    }

    Render_Attract()
    {

    }

    Render_Menu()
    {

    }

    Render_Credits()
    {

    }

    Render_HowToPlay()
    {

    }

    Render_Settings()
    {

    }

    Render_Lobby()
    {
    }

    Render_Game()
    {
        g_renderer.BeginCamera(this.m_worldCamera);
        {
            this.m_map.Render();
        }
        g_renderer.EndCamera(this.m_worldCamera);
    }

    Render_MatchEnd()
    {

    }

    Enter_Attract()
    {

    }

    Exit_Attract()
    {

    }

    Enter_Menu()
    {

    }

    Exit_Menu()
    {

    }

    Enter_Credits()
    {

    }

    Exit_Credits()
    {

    }

    Enter_HowToPlay()
    {

    }

    Exit_HowToPlay()
    {

    }

    Enter_Settings()
    {

    }

    Exit_Settings()
    {

    }

    Enter_Lobby()
    {
        // Create all players
        this.m_players.push(new PlayerController(0));
        this.m_players.push(new PlayerController(1));
        this.m_players.push(new PlayerController(2));
        this.m_players.push(new PlayerController(3));
    }

    Exit_Lobby()
    {

    }

    Enter_Game()
    {
        this.m_map = new Map(this);
    }

    Exit_Game()
    {

    }

    Enter_MatchEnd()
    {

    }

    Exit_MatchEnd()
    {

    }

    HandleStateChange()
    {
        if (this.m_nextState === GameState.NONE)
        {
            return;
        }

        if (this.m_transitionTimer.IsStopped())
        {
            this.m_transitionTimer.Start();
        }

        if (this.m_transitionTimer.HasDurationElapsed())
        {
            switch (this.m_state)
            {
                case GameState.ATTRACT:		    this.Exit_Attract();		break;
                case GameState.MENU:			this.Exit_Menu();			break;
                case GameState.HOW_TO_PLAY:	    this.Exit_HowToPlay();		break;
                case GameState.SETTINGS:		this.Exit_Settings();		break;
                case GameState.CREDITS:		    this.Exit_Credits();		break;
                case GameState.LOBBY:		    this.Exit_Lobby();			break;
                case GameState.GAME:			this.Exit_Game();			break;
            }

            this.m_state = this.m_nextState;
            this.m_nextState = GameState.NONE;
            this.m_clock.Reset();

            switch (this.m_state)
            {
                case GameState.ATTRACT:		    this.Enter_Attract();		break;
                case GameState.MENU:			this.Enter_Menu();			break;
                case GameState.HOW_TO_PLAY:	    this.Enter_HowToPlay();		break;
                case GameState.SETTINGS:		this.Enter_Settings();		break;
                case GameState.CREDITS:		    this.Enter_Credits();		break;
                case GameState.LOBBY:		    this.Enter_Lobby();			break;
                case GameState.GAME:			this.Enter_Game();			break;
            }

            this.m_transitionTimer.Stop();
        }
    }

    RenderOutroTransition()
    {
        if (this.m_nextState === GameState.NONE)
        {
            return;
        }

        const t = MathUtils.EaseOutQuadratic(this.m_transitionTimer.GetElapsedFraction());
        const transitionColor = Rgba8.Lerp(Rgba8.TRANSPARENT_BLACK, Rgba8.BLACK, t);

        const transitionVerts = [];
        const screenBox = new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
        VertexUtils.AddPCUVertsForAABB2(transitionVerts, screenBox, transitionColor);
        g_renderer.BeginCamera(this.m_screenCamera);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(transitionVerts);
        g_renderer.EndCamera(this.m_screenCamera);
    }

    RenderIntroTransition()
    {
        if (this.m_clock.GetTotalSeconds() > this.m_transitionTimer.m_duration)
        {
            return;
        }

        const t = MathUtils.EaseOutQuadratic(this.m_clock.GetTotalSeconds());
        const transitionColor = Rgba8.Lerp(Rgba8.BLACK, Rgba8.TRANSPARENT_BLACK, t);

        const transitionVerts = [];
        const screenBox = new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
        VertexUtils.AddPCUVertsForAABB2(transitionVerts, screenBox, transitionColor);
        g_renderer.BeginCamera(this.m_screenCamera);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(transitionVerts);
        g_renderer.EndCamera(this.m_screenCamera);
    }
}