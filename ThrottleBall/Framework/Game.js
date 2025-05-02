"use strict";

import {
    g_app,
    GetTeamColor,
    SCREEN_SIZE_Y,
    Team,
    WORLD_SIZE_X,
    WORLD_SIZE_Y,
    PRIMARY_COLOR,
    PRIMARY_COLOR_VARIANT_LIGHT,
    PRIMARY_COLOR_VARIANT_DARK,
    SECONDARY_COLOR,
    SECONDARY_COLOR_VARIANT_LIGHT,
    SECONDARY_COLOR_VARIANT_DARK,
    TERTIARY_COLOR,
    TERTIARY_COLOR_VARIANT_LIGHT,
    TERTIARY_COLOR_VARIANT_DARK,
    ASPECT,
    NUM_CAR_CHOICES,
    CAR_IMAGE_PATHS,
    GetTeamFromCarImageIndex,
    GetTeamString,
    GetTimeStringFromSeconds
} from "/ThrottleBall/Framework/GameCommon.js";

import {SubscribeButtonEvents} from "/ThrottleBall/Framework/ButtonEvents.js";
import Car from "/ThrottleBall/Gameplay/Car.js";
import Map from "/ThrottleBall/Gameplay/Map.js";
import PlayerController from "/ThrottleBall/Gameplay/PlayerController.js";
import Particle from "/ThrottleBall/Gameplay/Particle.js";

import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_debugRenderSystem,
    g_modelLoader,
    g_webXR,
    g_windowManager,
    g_audio, g_ui
} from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import * as FileUtils from "/Engine/Core/FileUtils.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js"
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import { XboxButtonID } from "/Engine/Input/XboxController.js";

import AABB2 from "/Engine/Math/AABB2.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import * as RNG from "/Engine/Math/RandomNumberGenerator.js";
import Vec2 from "/Engine/Math/Vec2.js";

import Camera from "/Engine/Renderer/Camera.js";
import { BlendMode, CullMode, DepthMode, g_aspect, VertexType } from "/Engine/Renderer/Renderer.js";


export class PlayerState
{
    static NOT_JOINED = 0;
    static JOINED = 1;
    static READY = 2;
}


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
    static MATCH_DURATION_SECONDS = 300;

    constructor()
    {
        // Initialize world camera
        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetOrthoView(Vec2.ZERO, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y));
        // Initialize screen camera
        this.m_screenCamera = new Camera();
        this.m_screenCamera.SetOrthoView(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));

        this.m_clock = new Clock();

        this.m_timeInState = 0.0;

        // Load BitmapFont
        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/Sandbox/Data/Images/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });

        this.m_transitionTimer = new Stopwatch(0.5);
        this.m_state = GameState.ATTRACT;
        this.m_nextState = GameState.NONE;

        this.m_players = [];
        this.m_playerCarChoiceIndexes = [];
        this.m_playerStatus = [];
        this.m_map = null;
        this.m_arePlayersLocked = false;

        this.m_particles = [];

        this.m_blueTeamScore = 0;
        this.m_redTeamScore = 0;

        this.SetGlobalRendererSettings();
        this.LoadAssets();
        this.InitializeUI();
        SubscribeButtonEvents();

        // DOM.GetElementByID("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });
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

    InitializeUI()
    {
        this.m_attractWidget = null;
        this.m_menuWidget = null;
        this.m_lobbyWidget = null;
        this.m_gameWidget = null;
        this.m_matchEndWidget = null;

        this.InitializeAttractUI();
        this.InitializeMenuUI();
        this.InitializeLobbyUI();
        this.InitializeGameUI();
        this.InitializeMatchEndUI();
    }

    InitializeAttractUI()
    {
        this.m_attractWidget = g_ui.CreateWidget();
        this.m_attractWidget.SetPosition(new Vec2(0.0, 0.0))
            .SetDimensions(new Vec2(1.0, 1.0))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 0));

        const attractLogoWidget = g_ui.CreateWidget(this.m_attractWidget);
        attractLogoWidget.SetImage("/ThrottleBall/Data/Images/ThrottleBall_Logo.png")
            .SetPosition(new Vec2(0.5, 0.5))
            .SetDimensions(new Vec2(0.5, 0.5))
            .SetPivot(new Vec2(0.5, 0.5))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetColor(new Rgba8(255, 255, 255, 255));

        const attractTextWidget = g_ui.CreateWidget(this.m_attractWidget);
        attractTextWidget.SetText("Connect a controller and press A to Start...")
            .SetPosition(new Vec2(0.5, 0.1))
            .SetDimensions(new Vec2(0.5, 0.5))
            .SetPivot(new Vec2(0.5, 0.5))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetColor(new Rgba8(255, 255, 255, 255))
            .SetFontSize(4.0);

        this.m_engineVersion = "";
        FileUtils.ReadToString("/Engine/version.json").then(versionJson =>
        {
            const versionJsonParsed = JSON.parse(versionJson);
            this.m_engineVersion = versionJsonParsed["version"];
        })

        this.m_engineVersionWidget = g_ui.CreateWidget(this.m_attractWidget);
        this.m_engineVersionWidget.SetText("Loading engine version")
            .SetPosition(new Vec2(0.01, 1.0))
            .SetDimensions(new Vec2(1.0, 0.05))
            .SetPivot(new Vec2(0.0, 1.0))
            .SetAlignment(new Vec2(0.0, 0.5))
            .SetFontSize(2.0)
            .SetColor(Rgba8.WHITE);

        this.m_gameVersion = "";
        FileUtils.ReadToString("/ThrottleBall/version.json").then(versionJson =>
        {
            const versionJsonParsed = JSON.parse(versionJson);
            this.m_gameVersion = versionJsonParsed["version"];
        })

        this.m_gameVersionWidget = g_ui.CreateWidget(this.m_attractWidget);
        this.m_gameVersionWidget.SetText("Loading game version")
            .SetPosition(new Vec2(0.01, 0.975))
            .SetDimensions(new Vec2(1.0, 0.05))
            .SetPivot(new Vec2(0.0, 1.0))
            .SetAlignment(new Vec2(0.0, 0.5))
            .SetFontSize(2.0)
            .SetColor(Rgba8.WHITE);
    }

    InitializeMenuUI()
    {
        this.m_menuWidget = g_ui.CreateWidget();
        this.m_menuWidget.SetPosition(new Vec2(0.0, 0.0))
            .SetDimensions(new Vec2(1.0, 1.0))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetVisible(false)
            .SetFocus(false);
    }

    InitializeLobbyUI()
    {
        this.m_lobbyWidget = g_ui.CreateWidget();
        this.m_lobbyWidget.SetPosition(new Vec2(0.0, 0.0))
            .SetDimensions(new Vec2(1.0, 1.0))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetVisible(false);

        this.m_playerLobbyWidgets = [];
        this.m_playerJoinInfoTextWidgets = [];
        this.m_playerPrevCarButtonWidgets = [];
        this.m_playerCarWidgets = [];
        this.m_playerNextCarButtonWidgets = [];
        this.m_playerTeamTextWidgets = [];
        this.m_playerTeamWidgets = [];

        //-----------------------------------------------------------------------------
        // Player 1
        //-----------------------------------------------------------------------------

        this.m_playerLobbyWidgets[0] = g_ui.CreateWidget(this.m_lobbyWidget);
        this.m_playerLobbyWidgets[0].SetPosition(new Vec2(0.0, 0.75))
            .SetDimensions(new Vec2(1.0, 0.25))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetBorderWidth(0.002)
            .SetBorderColor(Rgba8.WHITE);

        this.CreateLobbyWidgetsForPlayerIndexParentedToWidget(0, this.m_playerLobbyWidgets[0]);

        //-----------------------------------------------------------------------------
        // Player 2
        //-----------------------------------------------------------------------------

        this.m_playerLobbyWidgets[1] = g_ui.CreateWidget(this.m_lobbyWidget);
        this.m_playerLobbyWidgets[1].SetPosition(new Vec2(0.0, 0.5))
            .SetDimensions(new Vec2(1.0, 0.25))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetBorderWidth(0.002)
            .SetBorderColor(Rgba8.WHITE);

        this.CreateLobbyWidgetsForPlayerIndexParentedToWidget(1, this.m_playerLobbyWidgets[1]);


        //-----------------------------------------------------------------------------
        // Player 3
        //-----------------------------------------------------------------------------

        this.m_playerLobbyWidgets[2] = g_ui.CreateWidget(this.m_lobbyWidget);
        this.m_playerLobbyWidgets[2].SetPosition(new Vec2(0.0, 0.25))
            .SetDimensions(new Vec2(1.0, 0.25))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetBorderWidth(0.002)
            .SetBorderColor(Rgba8.WHITE);

        this.CreateLobbyWidgetsForPlayerIndexParentedToWidget(2, this.m_playerLobbyWidgets[2]);

        //-----------------------------------------------------------------------------
        // Player 4
        //-----------------------------------------------------------------------------

        this.m_playerLobbyWidgets[3] = g_ui.CreateWidget(this.m_lobbyWidget);
        this.m_playerLobbyWidgets[3].SetPosition(new Vec2(0.0, 0.0))
            .SetDimensions(new Vec2(1.0, 0.25))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 255))
            .SetBorderWidth(0.002)
            .SetBorderColor(Rgba8.WHITE);

        this.CreateLobbyWidgetsForPlayerIndexParentedToWidget(3, this.m_playerLobbyWidgets[3]);
    }

    CreateLobbyWidgetsForPlayerIndexParentedToWidget(playerIndex, parentWidget)
    {
        const player2TextWidget = g_ui.CreateWidget(parentWidget);
        player2TextWidget.SetText("Player " + (playerIndex + 1))
            .SetPosition(new Vec2(0.0, 1.0))
            .SetDimensions(new Vec2(0.3, 1.0))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.05, 0.0))
            .SetColor(Rgba8.WHITE)
            .SetFontSize(6.0);

        this.m_playerJoinInfoTextWidgets[playerIndex] = g_ui.CreateWidget(parentWidget);
        this.m_playerJoinInfoTextWidgets[playerIndex].SetText("Connect a controller to join!")
            .SetPosition(new Vec2(0.0, 0.6))
            .SetDimensions(new Vec2(0.3, 1.0))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.05, 0.0))
            .SetColor(Rgba8.WHITE)
            .SetFontSize(4.0);

        this.m_playerPrevCarButtonWidgets[playerIndex] = g_ui.CreateWidget(parentWidget);
        this.m_playerPrevCarButtonWidgets[playerIndex].SetImage("/ThrottleBall/Data/Images/xbox_lb.png")
            .SetPosition(new Vec2(0.35, 0.1))
            .SetDimensions(new Vec2(0.25 / g_aspect, 0.25))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.0, 0.0))
            .SetColor(Rgba8.WHITE)
            .SetVisible(false);

        // const defaultCarIndex = playerIndex % 2 === 0 ? 0 : NUM_CAR_CHOICES / 2;

        this.m_playerCarWidgets[playerIndex] = g_ui.CreateWidget(parentWidget);
        this.m_playerCarWidgets[playerIndex].SetImage(CAR_IMAGE_PATHS[0])
            .SetPosition(new Vec2(0.3, 0.5))
            .SetDimensions(new Vec2(0.3, 0.5))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.0, 0.0))
            .SetColor(Rgba8.WHITE)
            .SetVisible(false);

        this.m_playerNextCarButtonWidgets[playerIndex] = g_ui.CreateWidget(parentWidget);
        this.m_playerNextCarButtonWidgets[playerIndex].SetImage("/ThrottleBall/Data/Images/xbox_rb.png")
            .SetPosition(new Vec2(0.4, 0.1))
            .SetDimensions(new Vec2(0.25 / g_aspect, 0.25))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.0, 0.0))
            .SetColor(Rgba8.WHITE)
            .SetVisible(false);

        this.m_playerTeamTextWidgets[playerIndex] = g_ui.CreateWidget(parentWidget);
        this.m_playerTeamTextWidgets[playerIndex] .SetText("Team")
            .SetPosition(new Vec2(0.75, 1.0))
            .SetDimensions(new Vec2(0.3, 1.0))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.05, 0.0))
            .SetColor(Rgba8.WHITE)
            .SetFontSize(4.0)
            .SetVisible(false);

        this.m_playerTeamWidgets[playerIndex] = g_ui.CreateWidget(parentWidget);
        this.m_playerTeamWidgets[playerIndex].SetText(GetTeamString(GetTeamFromCarImageIndex(0)))
            .SetPosition(new Vec2(0.75, 0.8))
            .SetDimensions(new Vec2(0.3, 1.0))
            .SetPivot(new Vec2(0.0, 0.5))
            .SetAlignment(new Vec2(0.05, 0.0))
            .SetColor(GetTeamColor(GetTeamFromCarImageIndex(0)))
            .SetFontSize(4.0)
            .SetVisible(false);
    }

    InitializeGameUI()
    {
        this.m_gameWidget = g_ui.CreateWidget();
        this.m_gameWidget.SetPosition(new Vec2(0.0, 0.0))
            .SetDimensions(new Vec2(1.0, 1.0))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetVisible(false);

        this.m_blueTeamScoreWidget = g_ui.CreateWidget(this.m_gameWidget);
        this.m_blueTeamScoreWidget.SetPosition(new Vec2(0.495, 1.0))
            .SetDimensions(new Vec2(0.05 / g_aspect, 0.05))
            .SetPivot(new Vec2(1.0, 1.0))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetText("0")
            .SetFontSize(4.0)
            .SetBackgroundColor(TERTIARY_COLOR)
            .SetColor(GetTeamColor(Team.BLUE));

        this.m_redTeamScoreWidget = g_ui.CreateWidget(this.m_gameWidget);
        this.m_redTeamScoreWidget.SetPosition(new Vec2(0.505, 1.0))
            .SetDimensions(new Vec2(0.05 / g_aspect, 0.05))
            .SetPivot(new Vec2(0.0, 1.0))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetText("0")
            .SetFontSize(4.0)
            .SetBackgroundColor(TERTIARY_COLOR)
            .SetColor(GetTeamColor(Team.RED));

        this.m_timeWidget = g_ui.CreateWidget(this.m_gameWidget);
        this.m_timeWidget.SetPosition(new Vec2(0.5, 0.))
            .SetDimensions(new Vec2(0.3 / g_aspect, 0.05))
            .SetPivot(new Vec2(0.5, 0.0))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetText(GetTimeStringFromSeconds(Game.MATCH_DURATION_SECONDS))
            .SetFontSize(4.0)
            .SetBackgroundColor(TERTIARY_COLOR_VARIANT_DARK)
            .SetColor(Rgba8.WHITE);

        this.m_countdownTimerWidget = g_ui.CreateWidget(this.m_gameWidget);
        this.m_countdownTimerWidget.SetText("")
            .SetPosition(new Vec2(0.5, 0.75))
            .SetDimensions(new Vec2(0.2, 0.2))
            .SetPivot(new Vec2(0.5, 0.5))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetColor(Rgba8.WHITE)
            .SetFontSize(12.0);
    }

    InitializeMatchEndUI()
    {
        this.m_matchEndWidget = g_ui.CreateWidget();
        this.m_matchEndWidget.SetPosition(new Vec2(0.0, 0.0))
            .SetDimensions(new Vec2(1.0, 1.0))
            .SetBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetHoverBackgroundColor(new Rgba8(0, 0, 0, 0))
            .SetVisible(false);

        this.m_matchEndWinnerTextWidget = g_ui.CreateWidget(this.m_matchEndWidget);
        this.m_matchEndWinnerTextWidget.SetText("")
            .SetPosition(new Vec2(0.5, 0.5))
            .SetDimensions(new Vec2(1.0, 0.5))
            .SetPivot(new Vec2(0.5, 0.5))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetColor(Rgba8.WHITE)
            .SetFontSize(12.0);

        const infoText = g_ui.CreateWidget(this.m_matchEndWidget);
        infoText.SetText("B to return to lobby\nY for a rematch")
            .SetPosition(new Vec2(0.5, 0.2))
            .SetDimensions(new Vec2(1.0, 0.1))
            .SetPivot(new Vec2(0.5, 0.5))
            .SetAlignment(new Vec2(0.5, 0.5))
            .SetColor(Rgba8.WHITE)
            .SetFontSize(4.0)
            .SetColor(Rgba8.WHITE);
    }

    FixedUpdate(deltaSeconds)
    {

    }

    Update()
    {
        this.m_timeInState += Clock.SystemClock.GetDeltaSeconds();

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

        for (let particleIndex = 0; particleIndex < this.m_particles.length; particleIndex++)
        {
            this.m_particles[particleIndex].Update(Clock.SystemClock.GetDeltaSeconds());
        }

        this.DestroyDeadParticles();
        this.HandleStateChange();
        this.UpdateCameras();
    }

    UpdateCameras()
    {
        if (g_aspect > ASPECT)
        {
            // Need pillarbox borders
            const windowWorldWidth = WORLD_SIZE_Y * g_aspect;
            const deltaWorldWidth = windowWorldWidth - WORLD_SIZE_X;
            this.m_worldCamera.SetOrthoView(Vec2.ZERO.GetSum(Vec2.WEST.GetScaled(deltaWorldWidth * 0.5)), new Vec2(WORLD_SIZE_X + deltaWorldWidth * 0.5, WORLD_SIZE_Y));
        }
        else if (g_aspect < ASPECT)
        {
            // Need letterbox borders
            const windowWorldHeight = WORLD_SIZE_X / g_aspect;
            const deltaWorldHeight = windowWorldHeight - WORLD_SIZE_Y;
            this.m_worldCamera.SetOrthoView(Vec2.ZERO.GetSum(Vec2.SOUTH.GetScaled(deltaWorldHeight * 0.5)), new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y + deltaWorldHeight * 0.5));
        }
        else
        {
            // Remove all borders, aspects are exactly equal
            this.m_worldCamera.SetOrthoView(Vec2.ZERO, new Vec2(WORLD_SIZE_X, WORLD_SIZE_Y));
        }
        this.m_screenCamera.SetOrthoView(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
    }

    Update_Attract()
    {
        const numConnectedControllers = g_input.m_gamepads.length;
        for (let controllerIndex = 0; controllerIndex < numConnectedControllers; controllerIndex++)
        {
            const controller = g_input.GetController(controllerIndex);
            if (controller.WasButtonJustPressed(XboxButtonID.A))
            {
                this.m_nextState = GameState.LOBBY;
            }
        }

        if (this.m_engineVersion !== "")
        {
            this.m_engineVersionWidget.SetText("Engine Version: " + this.m_engineVersion);
        }
        if (this.m_gameVersion !== "")
        {
            this.m_gameVersionWidget.SetText("Game Version: " + this.m_gameVersion);
        }
    }

    Update_Menu()
    {
        if (g_input.WasKeyJustPressed("UP_ARROW"))
        {
            g_ui.SetLastHoveredWidget(g_ui.GetPreviousWidget());
        }
        if (g_input.WasKeyJustPressed("DOWN_ARROW"))
        {
            g_ui.SetLastHoveredWidget(g_ui.GetNextWidget());
        }
        if (g_input.WasKeyJustPressed("Space"))
        {
            g_console.Execute(g_ui.GetLastHoveredWidget().m_clickEventName);
        }
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
        const numConnectedControllers = g_input.m_gamepads.length;

        this.HandleLobbyInputsForController(0);
        this.HandleLobbyInputsForController(1);
        this.HandleLobbyInputsForController(2);
        this.HandleLobbyInputsForController(3);
    }

    HandleLobbyInputsForController(controllerIndex)
    {
        if (controllerIndex >= g_input.m_gamepads.length)
        {
            return;
        }
        if (this.m_arePlayersLocked)
        {
            return;
        }

        if (!this.m_playerStatus[controllerIndex])
        {
            this.m_playerStatus[controllerIndex] = PlayerState.NOT_JOINED;
            this.m_playerJoinInfoTextWidgets[controllerIndex].SetText("Press A to join");
        }

        const controller = g_input.GetController(controllerIndex);

        if (controller.WasButtonJustPressed(XboxButtonID.LEFT_SHOULDER) && this.m_playerStatus[controllerIndex] === PlayerState.JOINED)
        {
            this.m_playerCarChoiceIndexes[controllerIndex]--;
            if (this.m_playerCarChoiceIndexes[controllerIndex] < 0)
            {
                this.m_playerCarChoiceIndexes[controllerIndex] = NUM_CAR_CHOICES - 1;
            }
            this.m_playerCarWidgets[controllerIndex].SetImage(CAR_IMAGE_PATHS[this.m_playerCarChoiceIndexes[controllerIndex]]);
            this.m_players[controllerIndex].m_team = GetTeamFromCarImageIndex(this.m_playerCarChoiceIndexes[controllerIndex]);
            this.m_playerTeamWidgets[controllerIndex]
                .SetText(GetTeamString(this.m_players[controllerIndex].m_team))
                .SetColor(GetTeamColor(this.m_players[controllerIndex].m_team));
        }
        if (controller.WasButtonJustPressed(XboxButtonID.RIGHT_SHOULDER) && this.m_playerStatus[controllerIndex] === PlayerState.JOINED)
        {
            this.m_playerCarChoiceIndexes[controllerIndex]++;
            if (this.m_playerCarChoiceIndexes[controllerIndex] === NUM_CAR_CHOICES)
            {
                this.m_playerCarChoiceIndexes[controllerIndex] = 0;
            }
            this.m_playerCarWidgets[controllerIndex].SetImage(CAR_IMAGE_PATHS[this.m_playerCarChoiceIndexes[controllerIndex]]);
            this.m_players[controllerIndex].m_team = GetTeamFromCarImageIndex(this.m_playerCarChoiceIndexes[controllerIndex]);
            this.m_playerTeamWidgets[controllerIndex]
                .SetText(GetTeamString(this.m_players[controllerIndex].m_team))
                .SetColor(GetTeamColor(this.m_players[controllerIndex].m_team));
        }
        if (controller.WasButtonJustPressed(XboxButtonID.A))
        {
            if (this.m_playerStatus[controllerIndex] === PlayerState.NOT_JOINED)
            {
                const playersAlreadyJoined = this.GetNumJoinedPlayers();
                if (playersAlreadyJoined % 2 === 0)
                {
                    this.m_playerCarChoiceIndexes[controllerIndex] = 0;
                }
                else
                {
                    this.m_playerCarChoiceIndexes[controllerIndex] = NUM_CAR_CHOICES / 2;
                }
                this.m_playerCarWidgets[controllerIndex].SetImage(CAR_IMAGE_PATHS[this.m_playerCarChoiceIndexes[controllerIndex]]);
                this.m_playerJoinInfoTextWidgets[controllerIndex].SetText("Press A when Ready!");
                this.SetWidgetsVisibleForPlayer(controllerIndex);
                this.m_players[controllerIndex] = new PlayerController(controllerIndex, controllerIndex % 2 === 0 ? Team.BLUE : Team.RED);
                this.m_players[controllerIndex].m_team = GetTeamFromCarImageIndex(this.m_playerCarChoiceIndexes[controllerIndex]);
                this.m_playerStatus[controllerIndex] = PlayerState.JOINED;
            }
            else if (this.m_playerStatus[controllerIndex] === PlayerState.JOINED)
            {
                this.m_playerStatus[controllerIndex] = PlayerState.READY;
                this.m_playerJoinInfoTextWidgets[controllerIndex].SetText("Ready!");
            }
            else
            {
                // Check if all players are ready
                let areAllPlayersReady = true;
                for (let playerIndex = 0; playerIndex < this.m_players.length; playerIndex++)
                {
                    if (this.m_playerStatus[playerIndex] === PlayerState.JOINED)
                    {
                        areAllPlayersReady = false;
                        break;
                    }
                }
                if (areAllPlayersReady)
                {
                    this.m_arePlayersLocked = true;
                    this.m_nextState = GameState.GAME;
                }
            }
        }
        if (controller.WasButtonJustPressed(XboxButtonID.B) && this.m_playerStatus[controllerIndex] === PlayerState.READY)
        {
            this.m_playerStatus[controllerIndex] = PlayerState.JOINED;
            this.m_playerJoinInfoTextWidgets[controllerIndex].SetText("Press A when Ready!");
        }
        else if (controller.WasButtonJustPressed(XboxButtonID.B) && this.m_playerStatus[controllerIndex] === PlayerState.JOINED)
        {
            this.m_playerStatus[controllerIndex] = PlayerState.NOT_JOINED;
            this.m_players.splice(controllerIndex, 1);
            this.m_playerCarChoiceIndexes.splice(controllerIndex, 1);
            this.SetWidgetsHiddenForPlayer(controllerIndex);
        }
    }

    GetNumJoinedPlayers()
    {
        let numPlayersJoined = 0;
        for (let playerIndex = 0; playerIndex < this.m_playerStatus.length; playerIndex++)
        {
            if (this.m_playerStatus[playerIndex] === PlayerState.JOINED)
            {
                numPlayersJoined++;
            }
        }

        return numPlayersJoined;
    }

    SetWidgetsVisibleForPlayer(playerIndex)
    {
        this.m_playerPrevCarButtonWidgets[playerIndex].SetVisible(true);
        this.m_playerCarWidgets[playerIndex].SetVisible(true);
        this.m_playerNextCarButtonWidgets[playerIndex].SetVisible(true);
        this.m_playerTeamTextWidgets[playerIndex].SetVisible(true);
        this.m_playerTeamWidgets[playerIndex].SetVisible(true);
    }

    SetWidgetsHiddenForPlayer(playerIndex)
    {
        this.m_playerPrevCarButtonWidgets[playerIndex].SetVisible(false);
        this.m_playerCarWidgets[playerIndex].SetVisible(false);
        this.m_playerNextCarButtonWidgets[playerIndex].SetVisible(false);
        this.m_playerTeamTextWidgets[playerIndex].SetVisible(false);
        this.m_playerTeamWidgets[playerIndex].SetVisible(false);
    }

    Update_Game()
    {
        for (let playerIndex = 0; playerIndex < this.m_players.length; playerIndex++)
        {
                if (this.m_players[playerIndex] == null)
                {
                    continue;
                }

                if (this.m_players[playerIndex].m_car == null)
                {
                    continue;
                }

            this.m_players[playerIndex].HandleMovementInput();
        }
        this.m_map.Update();
    }

    Update_MatchEnd()
    {
        for (let playerIndex = 0; playerIndex < this.m_players.length; playerIndex++)
        {
            const gamepad = g_input.GetController(playerIndex);
            if (gamepad.WasButtonJustPressed(XboxButtonID.B))
            {
                this.m_nextState = GameState.LOBBY;
            }
            if (gamepad.WasButtonJustPressed(XboxButtonID.Y))
            {
                this.m_nextState = GameState.GAME;
            }
        }

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
    }

    ClearScreen()
    {
        g_renderer.ClearScreen(Rgba8.BLACK);
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

        for (let particleIndex = 0; particleIndex < this.m_particles.length; particleIndex++)
        {
            this.m_particles[particleIndex].Render();
        }

        g_ui.Render();

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

            // Render letterbox/pillarbox borders last
            const borderVerts = [];
            VertexUtils.AddPCUVertsForAABB2(borderVerts, new AABB2(new Vec2(this.m_worldCamera.GetOrthoBottomLeft().x, this.m_worldCamera.GetOrthoBottomLeft().y), new Vec2(this.m_worldCamera.GetOrthoTopRight().x, 0.0)), TERTIARY_COLOR);
            VertexUtils.AddPCUVertsForAABB2(borderVerts, new AABB2(new Vec2(this.m_worldCamera.GetOrthoBottomLeft().x, this.m_worldCamera.GetOrthoBottomLeft().y), new Vec2(0.0, this.m_worldCamera.GetOrthoTopRight().y)), TERTIARY_COLOR);
            VertexUtils.AddPCUVertsForAABB2(borderVerts, new AABB2(new Vec2(WORLD_SIZE_X, 0.0), new Vec2(this.m_worldCamera.GetOrthoTopRight().x, this.m_worldCamera.GetOrthoTopRight().y)), TERTIARY_COLOR);
            VertexUtils.AddPCUVertsForAABB2(borderVerts, new AABB2(new Vec2(0.0, WORLD_SIZE_Y), new Vec2(this.m_worldCamera.GetOrthoTopRight().x, this.m_worldCamera.GetOrthoTopRight().y)), TERTIARY_COLOR);
            g_renderer.BindShader(null);
            g_renderer.SetBlendMode(BlendMode.ALPHA);
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetDepthMode(DepthMode.DISABLED);
            g_renderer.SetModelConstants();
            g_renderer.BindTexture(null);
            g_renderer.DrawVertexArray(borderVerts);

        }
        g_renderer.EndCamera(this.m_worldCamera);
    }

    Render_MatchEnd()
    {

    }

    Enter_Attract()
    {
        this.m_attractWidget.SetVisible(true);
        this.m_attractWidget.SetFocus(true);
    }

    Exit_Attract()
    {
        this.m_attractWidget.SetVisible(false);
        this.m_attractWidget.SetFocus(false);
    }

    Enter_Menu()
    {
        this.m_menuWidget.SetVisible(true);
        this.m_menuWidget.SetFocus(true);
    }

    Exit_Menu()
    {
        this.m_menuWidget.SetVisible(false);
        this.m_menuWidget.SetFocus(false);
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
        this.m_players = [];
        this.m_playerCarChoiceIndexes = [];
        this.m_playerStatus = [];
        this.m_map = null;
        this.m_arePlayersLocked = false;
        for (let playerIndex = 0; playerIndex < 4; playerIndex++)
        {
            this.SetWidgetsHiddenForPlayer(playerIndex);
        }

        this.m_lobbyWidget.SetVisible(true);
        this.m_lobbyWidget.SetFocus(true);
    }

    Exit_Lobby()
    {
        this.m_lobbyWidget.SetVisible(false);
        this.m_lobbyWidget.SetFocus(false);
    }

    Enter_Game()
    {
        this.m_gameWidget.SetVisible(true);
        this.m_gameWidget.SetFocus(true);

        this.m_blueTeamScore = 0;
        this.m_redTeamScore = 0;

        this.m_blueTeamScoreWidget.SetText(this.m_blueTeamScore.toString());
        this.m_redTeamScoreWidget.SetText(this.m_redTeamScore.toString());

        this.m_map = new Map(this);
    }

    Exit_Game()
    {
        this.m_gameWidget.SetVisible(false);
        this.m_gameWidget.SetFocus(false);

        delete this.m_map;
    }

    Enter_MatchEnd()
    {
        this.m_clock.Unpause();

        let messageColor = GetTeamColor(Team.RED);
        let messageText = "Red Team Won!";

        if (this.m_blueTeamScore > this.m_redTeamScore)
        {
            messageColor = GetTeamColor(Team.BLUE);
            messageText = "Blue Team Won!";
        }
        messageText += "\n" + this.m_blueTeamScore + "-" + this.m_redTeamScore;

        this.m_matchEndWinnerTextWidget.SetColor(messageColor).SetText(messageText);

        this.m_matchEndWidget.SetVisible(true).SetFocus(true);
    }

    Exit_MatchEnd()
    {
        this.m_matchEndWidget.SetVisible(false).SetFocus(false);
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
                case GameState.MATCH_END:       this.Exit_MatchEnd();       break;
            }

            this.m_timeInState = 0.0;
            this.m_state = this.m_nextState;
            this.m_nextState = GameState.NONE;
            this.m_clock.Reset();
            this.m_particles = [];

            switch (this.m_state)
            {
                case GameState.ATTRACT:		    this.Enter_Attract();		break;
                case GameState.MENU:			this.Enter_Menu();			break;
                case GameState.HOW_TO_PLAY:	    this.Enter_HowToPlay();		break;
                case GameState.SETTINGS:		this.Enter_Settings();		break;
                case GameState.CREDITS:		    this.Enter_Credits();		break;
                case GameState.LOBBY:		    this.Enter_Lobby();			break;
                case GameState.GAME:			this.Enter_Game();			break;
                case GameState.MATCH_END:		this.Enter_MatchEnd();		break;
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
        if (this.m_timeInState > this.m_transitionTimer.m_duration)
        {
            return;
        }

        const t = MathUtils.EaseOutQuadratic(this.m_timeInState);
        const transitionColor = Rgba8.Lerp(Rgba8.BLACK, Rgba8.TRANSPARENT_BLACK, t);

        const transitionVerts = [];
        const screenBox = new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
        VertexUtils.AddPCUVertsForAABB2(transitionVerts, screenBox, transitionColor);
        g_renderer.BeginCamera(this.m_screenCamera);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(transitionVerts);
        g_renderer.EndCamera(this.m_screenCamera);
    }

    SpawnParticleCluster(numParticles, positionXRange, positionYRange, velXRange, velYRange, orientationRange, angularVelRange, minSize, maxSize, numVerts, color, lifetime, fadeOverLifetime = true)
    {
        for (let particleIndex = 0; particleIndex < numParticles; particleIndex++)
        {
            const particlePosition = RNG.RollRandomVec2UsingFloatRanges(positionXRange, positionYRange);
            const particleVelocity = RNG.RollRandomVec2UsingFloatRanges(velXRange, velYRange);
            const particleOrientation = RNG.RollRandomFloatUsingFloatRange(orientationRange);
            const particleAngularVelocity = RNG.RollRandomFloatUsingFloatRange(angularVelRange);

            const newParticle = new Particle(particlePosition, particleVelocity, particleOrientation, particleAngularVelocity, minSize, maxSize, numVerts, color, lifetime, fadeOverLifetime);
            this.m_particles.push(newParticle);
        }
    }

    DestroyDeadParticles()
    {
        for (let particleIndex = 0; particleIndex < this.m_particles.length; particleIndex++)
        {
            if (this.m_particles[particleIndex].m_lifetimeTimer.HasDurationElapsed())
            {
                this.m_particles.splice(particleIndex, 1);
            }
        }
    }
}