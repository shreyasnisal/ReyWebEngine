"use strict";

import Game from "/ThrottleBall/Framework/Game.js";
import {g_app, SCREEN_SIZE_Y} from "/ThrottleBall/Framework/GameCommon.js";

import {
    g_renderer,
    g_input,
    g_console,
    g_eventSystem,
    g_windowManager,
    g_debugRenderSystem, g_audio, g_ui,
} from "/Engine/Core/EngineCommon.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Clock from "/Engine/Core/Clock.js";
import { DevConsoleMode } from "/Engine/Core/DevConsole.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";

import { g_aspect, BlendMode, CullMode, DepthMode } from "/Engine/Renderer/Renderer.js";

1
export default class App
{
    constructor()
    {
        this.m_numFrames = 0;
        this.m_deltaSecondsSum = 0.0;
    }

    Startup()
    {
        g_eventSystem.Startup();
        g_windowManager.Startup();
        g_renderer.Startup();
        g_debugRenderSystem.Startup();
        g_console.Startup();
        g_input.Startup();
        g_audio.Startup();
        g_ui.Startup();

        this.m_game = new Game();
    }

    RunFrame(time, frame)
    {
        Clock.TickSystemClock();

        this.BeginFrame(frame);
        this.Update();
        this.Render();
        this.EndFrame();

        requestAnimationFrame(this.RunFrame.bind(this));
    }

    BeginFrame(frame)
    {
        g_eventSystem.BeginFrame();
        g_windowManager.BeginFrame();
        g_renderer.BeginFrame();
        g_debugRenderSystem.BeginFrame();
        g_console.BeginFrame();
        g_input.BeginFrame();
        g_audio.BeginFrame();
        g_ui.BeginFrame();
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
            g_debugRenderSystem.AddScreenText("FPS: " + (1.0 / averageDeltaSeconds).toFixed(0), new Vec2(SCREEN_SIZE_Y * g_aspect - 24.0, SCREEN_SIZE_Y - 24.0), 12.0, new Vec2(1.0, 0.0), 1.0, Rgba8.WHITE, Rgba8.WHITE);
            this.m_numFrames = 0;
            this.m_deltaSecondsSum = 0.0;
        }

        if (g_input.WasKeyJustPressed('Tab'))
        {
            g_console.ToggleMode(DevConsoleMode.OPENFULL);
        }

        this.m_game.Update(deltaSeconds);
    }

    Render()
    {
        this.m_game.ClearScreen();
        g_renderer.BeginCamera(this.m_game.m_worldCamera);
        this.m_game.Render();
        g_renderer.EndCamera(this.m_game.m_worldCamera);

        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();

        g_renderer.BindTexture(null);
        g_debugRenderSystem.RenderWorld(this.m_game.m_worldCamera);
        g_debugRenderSystem.RenderScreen(this.m_game.m_screenCamera);
        g_console.Render(new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y)));
    }

    EndFrame()
    {
        g_ui.EndFrame();
        g_audio.EndFrame();
        g_input.EndFrame();
        g_console.EndFrame();
        g_debugRenderSystem.EndFrame();
        g_renderer.EndFrame();
        g_windowManager.EndFrame();
        g_eventSystem.EndFrame();
    }

    Shutdown()
    {
        g_ui.Shutdown();
        g_audio.Shutdown();
        g_input.Shutdown();
        g_console.Shutdown();
        g_debugRenderSystem.Shutdown();
        g_renderer.Shutdown();
        g_windowManager.Shutdown();
        g_eventSystem.Shutdown();
    }
}
