"use strict";

import Game from "/PortfolioGame/Framework/Game.js";
import {g_app, SCREEN_SIZE_Y} from "/PortfolioGame/Framework/GameCommon.js";

import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_windowManager,
    g_debugRenderSystem,
    g_modelLoader, g_webXR
} from "/Engine/Core/EngineCommon.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Clock from "/Engine/Core/Clock.js";
import { DevConsoleMode } from "/Engine/Core/DevConsole.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";

import Camera from "/Engine/Renderer/Camera.js";
import { g_aspect } from "/Engine/Renderer/Renderer.js";


export default class App
{
    constructor()
    {
        this.m_numFrames = 0;
        this.m_deltaSecondsSum = 0.0;

        this.m_currentEye = "none";
        this.m_leftEyeCamera = new Camera();
        this.m_leftEyeCamera.SetRenderBasis(Vec3.GROUNDWARD, Vec3.WEST, Vec3.NORTH);
        this.m_rightEyeCamera = new Camera();
        this.m_rightEyeCamera.SetRenderBasis(Vec3.GROUNDWARD, Vec3.WEST, Vec3.NORTH);
    }

    Startup()
    {
        g_eventSystem.Startup();
        g_windowManager.Startup();
        g_renderer.Startup();
        g_debugRenderSystem.Startup();
        g_console.Startup();
        g_input.Startup();
        g_modelLoader.Startup();
        g_webXR.Startup();

        this.m_game = new Game();
    }

    RunFrame(time, frame)
    {
        Clock.TickSystemClock();

        this.BeginFrame(frame);
        this.Update();

        // Insert VR rendering here
        g_renderer.BeginRenderForVR();
        g_renderer.ClearScreen(Rgba8.WHITE);
        if (g_webXR.m_initialized)
        {
            this.m_currentEye = "left";
            g_renderer.SetVREye(this.m_currentEye);
            this.Render();

            this.m_currentEye = "right";
            g_renderer.SetVREye(this.m_currentEye);
            this.Render();
        }
        else
        {
            g_renderer.ClearScreen(Rgba8.WHITE);

            this.m_currentEye = "none";
            this.Render();
        }
        this.EndFrame();

        if (g_webXR.m_initialized)
        {
            g_webXR.m_xrSession.requestAnimationFrame(this.RunFrame.bind(this));
        }
        else
        {
            requestAnimationFrame(this.RunFrame.bind(this));
        }
    }

    BeginFrame(frame)
    {
        g_eventSystem.BeginFrame();
        g_windowManager.BeginFrame();
        g_renderer.BeginFrame();
        g_debugRenderSystem.BeginFrame();
        g_console.BeginFrame();
        g_input.BeginFrame();
        g_modelLoader.BeginFrame();
        if (g_webXR.m_initialized)
        {
            g_webXR.BeginFrame(frame);
        }
    }

    Update()
    {
        const deltaSeconds = Clock.SystemClock.GetDeltaSeconds();

        // Compute and display FPS averaged over the past 1 second
        this.m_deltaSecondsSum += deltaSeconds;
        this.m_numFrames++;
        if (this.m_deltaSecondsSum >= 1.0)
        {
            const averageDeltaSeconds = this.m_deltaSecondsSum / this.m_numFrames;
            g_debugRenderSystem.AddScreenText("FPS: " + (1.0 / averageDeltaSeconds).toFixed(0), new Vec2(g_aspect * SCREEN_SIZE_Y - 16.0, SCREEN_SIZE_Y - 16.0), 8.0, new Vec2(1.0, 0.0), 1.0, Rgba8.WHITE, Rgba8.WHITE);
            this.m_numFrames = 0;
            this.m_deltaSecondsSum = 0.0;
        }

        if (g_input.WasKeyJustPressed('Tab'))
        {
            g_console.ToggleMode(DevConsoleMode.OPENFULL);
        }

        this.m_game.Update(deltaSeconds);

        if (!g_webXR.m_initialized)
        {
            return;
        }

        const leftFoVs = g_webXR.GetFoVsForEye("left");
        if (leftFoVs)
        {
            this.m_leftEyeCamera.SetVRPerspectiveView(leftFoVs["left"], leftFoVs["right"], leftFoVs["up"], leftFoVs["down"], 0.01, 100.0);
        }
        this.m_leftEyeCamera.SetTransform(this.m_game.m_player.m_position.GetSum(g_webXR.GetPositionForEye_iFwd_jLeft_kUp("left")), g_webXR.GetOrientationForEye_iFwd_jLeft_kUp("left"));
        const rightFoVs = g_webXR.GetFoVsForEye("right");
        if (rightFoVs)
        {
            this.m_rightEyeCamera.SetVRPerspectiveView(rightFoVs["left"], rightFoVs["right"], rightFoVs["up"], rightFoVs["down"], 0.01, 100.0);
        }
        this.m_rightEyeCamera.SetTransform(this.m_game.m_player.m_position.GetSum(g_webXR.GetPositionForEye_iFwd_jLeft_kUp("right")), g_webXR.GetOrientationForEye_iFwd_jLeft_kUp("right"));

    }

    Render()
    {
        if (this.m_currentEye === "none")
        {
            g_renderer.BeginCamera(this.m_game.m_worldCamera);
        }
        else if (this.m_currentEye === "left")
        {
            g_renderer.BeginCamera(this.m_leftEyeCamera);
        }
        else if (this.m_currentEye === "right")
        {
            g_renderer.BeginCamera(this.m_rightEyeCamera);
        }

        this.m_game.Render();

        g_console.Render(new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y)));

        if (this.m_currentEye === "none")
        {
            g_renderer.EndCamera(this.m_game.m_worldCamera);
        }
        else if (this.m_currentEye === "left")
        {
            g_renderer.EndCamera(this.m_leftEyeCamera);
        }
        else if (this.m_currentEye === "right")
        {
            g_renderer.EndCamera(this.m_rightEyeCamera);
        }
    }

    EndFrame()
    {
        g_webXR.EndFrame();
        g_modelLoader.EndFrame();
        g_input.EndFrame();
        g_console.EndFrame();
        g_debugRenderSystem.EndFrame();
        g_renderer.EndFrame();
        g_windowManager.EndFrame();
        g_eventSystem.EndFrame();
    }

    Shutdown()
    {
        g_webXR.Shutdown();
        g_modelLoader.Shutdown();
        g_input.Shutdown();
        g_console.Shutdown();
        g_debugRenderSystem.Shutdown();
        g_renderer.Shutdown();
        g_windowManager.Shutdown();
        g_eventSystem.Shutdown();
    }
}
