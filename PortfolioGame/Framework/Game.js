"use strict";

import {g_app, SCREEN_SIZE_Y} from "/PortfolioGame/Framework/GameCommon.js";
import {DestroyCanvasAndShowContent} from "/PortfolioGame/Framework/Main.js";
import Map from "/PortfolioGame/Gameplay/Map.js";
import Player from "/PortfolioGame/Gameplay/Player.js";
import StaticEntityDefinition from "/PortfolioGame/Gameplay/StaticEntityDefinition.js";

import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_debugRenderSystem,
    g_modelLoader, g_windowManager
} from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import * as FileUtils from "/Engine/Core/FileUtils.js";
import CPUImage from "/Engine/Core/CPUImage.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";
import * as VideoUtils from "/Engine/Core/VideoUtils.js"

import AABB2 from "/Engine/Math/AABB2.js";
import AABB3 from "/Engine/Math/AABB3.js";
import EulerAngles from "/Engine/Math/EulerAngles.js";
import Mat44 from "/Engine/Math/Mat44.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vec4 from "/Engine/Math/Vec4.js";

import {TextBoxMode} from "/Engine/Renderer/BitmapFont.js";
import Camera from "/Engine/Renderer/Camera.js";
import { BlendMode, CullMode, DepthMode, g_aspect, VertexType } from "/Engine/Renderer/Renderer.js";
import SpriteAnimDefinition, { SpriteAnimPlaybackType } from "/Engine/Renderer/SpriteAnimDefinition.js";
import SpriteSheet from "/Engine/Renderer/SpriteSheet.js";


export class GameState
{
    static NONE = "NONE";
    static INTRO = "INTRO";
    static ATTRACT = "ATTRACT";
    static GAME = "GAME";
    static DESTROY = "DESTROY";
}

export default class Game
{
    constructor()
    {
        this.m_state = GameState.INTRO;
        this.m_nextState = GameState.NONE;

        this.m_clock = new Clock();
        this.m_timeInState = 0.0;
        this.m_transitionTimer = new Stopwatch(1.0, this.m_clock);

        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetRenderBasis(Vec3.SKYWARD, Vec3.WEST, Vec3.NORTH);
        this.m_worldCamera.SetTransform(new Vec3(0.0, 0.0, 0.0));
        this.m_screenCamera = new Camera();


        this.m_sunDirection = new Vec3(1.0, -2.0, -1.0);
        this.m_sunIntensity = 0.9;

        this.LoadAssets();

        this.m_squirrelFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/PortfolioGame/Data/Fonts/SquirrelFixedFont").then(font =>
        {
            this.m_squirrelFixedFont = font;
        });

        this.m_butlerFixedFont = null;
        g_renderer.CreateOrGetBitmapFont("/PortfolioGame/Data/Fonts/RobotoMonoSemiBold128").then(font =>
        {
            this.m_butlerFixedFont = font;
        });

        this.m_logoAnimation = null;
        this.m_logoBlinkAnimation = null;
        g_renderer.CreateOrGetTextureFromFile("/PortfolioGame/Data/Images/LogoSpriteSheet.png").then(texture =>
        {
            const logoSpriteSheet = new SpriteSheet(texture, new Vec2(15, 19));
            this.m_logoAnimation = new SpriteAnimDefinition(logoSpriteSheet, 0, 271, 2.0, SpriteAnimPlaybackType.ONCE);
            this.m_logoBlinkAnimation = new SpriteAnimDefinition(logoSpriteSheet, 270, 271, 0.5, SpriteAnimPlaybackType.LOOP);
        });

        this.m_portraitTexture = null;
        g_renderer.CreateOrGetTextureFromFile("/PortfolioGame/Data/Images/Shreyas.png").then(texture =>
        {
           this.m_portraitTexture = texture;
        });

        this.m_player = new Player(this, new Vec3(8.5, 12.5, 2.0), new EulerAngles(225.0, 0.0, 0.0));
        this.m_map = new Map(this, [
            "/PortfolioGame/Data/Images/Map0.png",
            "/PortfolioGame/Data/Images/Map1.png",
            "/PortfolioGame/Data/Images/Map2.png",
            "/PortfolioGame/Data/Images/Map3.png",
            "/PortfolioGame/Data/Images/Map0.png" ]);

        this.m_instructions = [
            "Hi, I'm Shreyas, aka Rey! I'm a generalist game programmer with experience in\ndeveloping custom game engines and in Unreal and Unity.\n\nPress E to continue...",
            "Use WASD to move and spacebar to jump. Look around using your mouse and\nhave fun in this room created using my JavaScript engine.\n\nPress E to continue...",
            "When you're ready to see some awesome personal projects I've worked on\nin my C++ engine and the 2 titles I've shipped in Unreal,\nwalk over to the TV and press E.\n\nPress E to continue..."
        ];
        this.m_currentInstructionsIndex = 0;
        this.m_numInstructionsGlyphsToShow = 0;

        document.getElementById("id_canvas").addEventListener("click", () => { this.HandleCanvasClicked() });
    }

    HandleCanvasClicked()
    {
        if (this.m_state === GameState.INTRO && this.m_timeInState >= 6.0)
        {
            g_input.SetCursorMode(true, true);
            this.m_nextState = GameState.GAME;
        }
        else if (this.m_state === GameState.GAME)
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
        this.HandleStateTransitions();
    }

    UpdateIntro()
    {
        if (this.m_logoAnimation == null)
        {
            return;
        }

        this.m_timeInState += this.m_clock.GetDeltaSeconds();
    }

    UpdateAttract()
    {
        this.m_timeInState += this.m_clock.GetDeltaSeconds();
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

        if (this.m_currentInstructionsIndex < this.m_instructions.length)
        {
            this.m_numInstructionsGlyphsToShow += this.m_clock.GetDeltaSeconds() * 32.0;

            if (g_input.WasKeyJustPressed('E'))
            {
                this.m_currentInstructionsIndex++;
                this.m_numInstructionsGlyphsToShow = 0;

                if (this.m_currentInstructionsIndex === this.m_instructions.length)
                {
                    this.m_player.m_controlsEnabled = true;
                }
            }
        }

        this.m_timeInState += this.m_clock.GetDeltaSeconds();
    }

    UpdateCameras()
    {
        this.m_worldCamera.SetPerspectiveView(g_aspect, 60.0, 0.01, 100);
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

        this.RenderIntroTransition();
        this.RenderOutroTransition();

        g_renderer.BindShader(null);
    }

    RenderIntro()
    {
        if (this.m_logoAnimation == null)
        {
            return;
        }

        const SCREEN_CENTER = new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y).GetScaled(0.5);

        g_renderer.BeginCamera(this.m_screenCamera);
        {
            let currentSprite = this.m_logoAnimation.GetSpriteDefAtTime(this.m_timeInState);
            if (this.m_clock.GetTotalSeconds() >= 2.0)
            {
                currentSprite = this.m_logoBlinkAnimation.GetSpriteDefAtTime(this.m_timeInState);
            }

            const screenVerts = [];
            g_renderer.BindShader(null);
            VertexUtils.AddPCUVertsForAABB2(screenVerts, new AABB2(new Vec2(SCREEN_CENTER.x - SCREEN_SIZE_Y * 0.48, SCREEN_CENTER.y - SCREEN_SIZE_Y * 0.3), new Vec2(SCREEN_CENTER.x + SCREEN_SIZE_Y * 0.48, SCREEN_CENTER.y + SCREEN_SIZE_Y * 0.3)), Rgba8.BLACK, currentSprite.GetUVs());
            g_renderer.SetBlendMode(BlendMode.ALPHA);
            g_renderer.SetCullMode(CullMode.NONE);
            g_renderer.SetDepthMode(DepthMode.DISABLED);
            g_renderer.SetModelConstants();
            g_renderer.BindTexture(this.m_logoAnimation.GetTexture());
            g_renderer.DrawVertexArray(screenVerts);


            const glyphsToDraw = MathUtils.RoundDownToInt((64.0 * this.m_timeInState - 128.0) / 3.0);

            const screenTextVerts = [];
            const textWidth1 = this.m_squirrelFixedFont.GetTextWidth(32.0, "Hi, I'm Shreyas, aka Rey.", 0.7);
            const textWidth2 = this.m_squirrelFixedFont.GetTextWidth(32.0, "Welcome to my JavaScript game engine!", 0.7);
            const textWidth3 = this.m_squirrelFixedFont.GetTextWidth(32.0, "Click anywhere to begin...", 0.7);
            const textWidth = Math.max(textWidth1, textWidth2, textWidth3);
            // this.m_butlerFixedFont.AddVertsForText2D(screenTextVerts, new Vec2(SCREEN_CENTER.x - textWidth * 0.5, SCREEN_SIZE_Y * 0.1), 32.0, "Hi, I'm Shreyas, aka Rey!", Rgba8.BLACK, 0.7);
            this.m_butlerFixedFont.AddVertsForTextInBox2D(screenTextVerts, new AABB2(new Vec2(SCREEN_CENTER.x - textWidth * 0.5, SCREEN_SIZE_Y * 0.1), new Vec2(SCREEN_CENTER.x + textWidth * 0.5, SCREEN_SIZE_Y * 0.2)), 32.0, "Hi, I'm Shreyas, aka Rey.\nWelcome to my JavaScript game engine!\nClick anywhere to begin...", Rgba8.BLACK, 0.5, new Vec2(0.5, 0.5), TextBoxMode.SHRINK_TO_FIT, glyphsToDraw);
            g_renderer.SetBlendMode(BlendMode.ALPHA);
            g_renderer.SetCullMode(CullMode.NONE);
            g_renderer.SetDepthMode(DepthMode.DISABLED);
            g_renderer.SetModelConstants();
            g_renderer.BindTexture(this.m_butlerFixedFont.GetTexture());
            g_renderer.DrawVertexArray(screenTextVerts);
        }
        g_renderer.EndCamera(this.m_screenCamera);
    }

    RenderAttract()
    {

    }

    RenderGame()
    {
        g_renderer.BeginCamera(this.m_worldCamera);
        this.m_map.Render();
        g_renderer.EndCamera(this.m_worldCamera);

        g_renderer.BeginCamera(this.m_screenCamera);
        g_renderer.BindShader(null);
        this.RenderInstructions();
        if (this.m_map != null)
        {
            this.m_map.RenderTVInfo();
        }
        g_renderer.EndCamera(this.m_screenCamera);
    }

    RenderInstructions()
    {
        if (this.m_currentInstructionsIndex >= this.m_instructions.length)
        {
            return;
        }
        if (this.m_portraitTexture == null)
        {
            return;
        }

        const instructionsBounds = new AABB2(new Vec2(20.0, 20.0), new Vec2(SCREEN_SIZE_Y * g_aspect - 20.0, SCREEN_SIZE_Y * 0.2 + 20.0));
        const instructionsBoundsDimensions = instructionsBounds.GetDimensions();

        const instructionsBackgroundVerts = [];
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(null);

        const instructionsPortraitBounds = instructionsBounds.GetBoxAtUVs(new Vec2(0.01, 0.1), new Vec2(0.01 + instructionsBoundsDimensions.y * 0.8 / instructionsBoundsDimensions.x, 0.9));
        const instructionsPortraitVerts = [];
        VertexUtils.AddPCUVertsForAABB2(instructionsPortraitVerts, instructionsPortraitBounds);
        g_renderer.BindTexture(this.m_portraitTexture);
        g_renderer.DrawVertexArray(instructionsPortraitVerts);

        // const instructionsTextBounds = instructionsBounds.GetBoxAtUVs(new Vec2(0.11 + instructionsBoundsDimensions.y * 0.8 / instructionsBoundsDimensions.x, 0.1), new Vec2(0.9, 0.9));
        const instructionsTextBackgroundBoundsMins = new Vec2(instructionsPortraitBounds.m_maxs.x, instructionsPortraitBounds.m_mins.y);
        instructionsTextBackgroundBoundsMins.Add(new Vec2(20.0, 0.0));
        const textWidth = this.m_butlerFixedFont.GetTextWidth(32.0, this.m_instructions[this.m_currentInstructionsIndex], 0.5);
        const instructionsTextBackgroundBoundsMaxs = new Vec2(textWidth + 20.0, SCREEN_SIZE_Y * 0.2 + 20.0);
        instructionsTextBackgroundBoundsMaxs.x = MathUtils.GetClamped(instructionsTextBackgroundBoundsMaxs.x, 0.0, SCREEN_SIZE_Y * g_aspect - 20.0);
        const instructionsTextBackgroundBounds = new AABB2(instructionsTextBackgroundBoundsMins, instructionsTextBackgroundBoundsMaxs);
        const instructionsTextBackgroundVerts = [];
        VertexUtils.AddPCUVertsForRoundedBox(instructionsTextBackgroundVerts, instructionsTextBackgroundBounds, 10.0, Rgba8.WHITE);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(instructionsTextBackgroundVerts);

        const instructionsTextBounds = instructionsTextBackgroundBounds;
        instructionsTextBounds.m_mins.Add(new Vec2(20.0, 10.0));
        instructionsTextBounds.m_maxs.Subtract(new Vec2(20.0, 10.0));

        const instructionsTextVerts = [];
        this.m_butlerFixedFont.AddVertsForTextInBox2D(instructionsTextVerts, instructionsTextBounds, 32.0, this.m_instructions[this.m_currentInstructionsIndex], Rgba8.BLACK, 0.5, new Vec2(0.0, 0.5), TextBoxMode.SHRINK_TO_FIT, MathUtils.RoundDownToInt(this.m_numInstructionsGlyphsToShow));
        g_renderer.BindTexture(this.m_butlerFixedFont.GetTexture());
        g_renderer.DrawVertexArray(instructionsTextVerts);
    }

    HandleStateTransitions()
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
            switch (this.m_state) {
                case GameState.INTRO:
                    // this.ExitIntro();
                    break;
                case GameState.ATTRACT:
                    // this.ExitAttract();
                    break;
                case GameState.GAME:
                    // this.ExitGame();
                    break;
            }

            this.m_state = this.m_nextState;
            this.m_nextState = GameState.NONE;

            switch (this.m_state)
            {
                case GameState.INTRO:
                    // this.EnterIntro();
                    break;
                case GameState.ATTRACT:
                    // this.EnterAttract();
                    break;
                case GameState.GAME:
                    // this.EnterGame();
                    break;
                case GameState.DESTROY:
                    DestroyCanvasAndShowContent();
                    break;
            }

            this.m_timeInState = 0.0;
            this.m_transitionTimer.Stop();
        }
    }

    RenderIntroTransition()
    {
        if (this.m_transitionTimer.IsStopped())
        {
            return;
        }

        if (this.m_timeInState > this.m_transitionTimer.m_duration)
        {
            return;
        }

        const t = MathUtils.EaseOutQuadratic(this.m_timeInState * 2.0);
        const transitionColor = Rgba8.Lerp(Rgba8.BLACK, Rgba8.TRANSPARENT_BLACK, t);

        const transitionVerts = [];
        const screenBox = new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
        VertexUtils.AddPCUVertsForAABB2(transitionVerts, screenBox, transitionColor);
        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetCullMode(CullMode.NONE);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(transitionVerts);
    }

    RenderOutroTransition()
    {
        if (this.m_state === GameState.NONE)
        {
            return;
        }

        const t = MathUtils.EaseOutQuadratic(this.m_transitionTimer.GetElapsedFraction());
        const transitionColor = Rgba8.Lerp(Rgba8.TRANSPARENT_BLACK, Rgba8.BLACK, t);

        const transitionVerts = [];
        const screenBox = new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y));
        VertexUtils.AddPCUVertsForAABB2(transitionVerts, screenBox, transitionColor);
        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetCullMode(CullMode.NONE);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(transitionVerts);
    }
}