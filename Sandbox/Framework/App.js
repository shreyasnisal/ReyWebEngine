"use strict";

import Main from "/Sandbox/Framework/Main.js";
import { SCREEN_SIZE_Y } from "/Sandbox/Framework/GameCommon.js";
import { g_renderer, g_input, g_console, g_eventSystem, g_windowManager } from "/Engine/Core/EngineCommon.js";
import Game from "/Sandbox/Framework/Game.js";

import Clock from "/Engine/Core/Clock.js";
import { DevConsoleMode } from "/Engine/Core/DevConsole.js";
import Vec2 from "/Engine/Math/Vec2.js";
import AABB2 from "/Engine/Math/AABB2.js";
import { g_aspect } from "/Engine/Renderer/Renderer.js";


export default class App
{
    constructor()
    {
        this.m_previousFrameTime = Math.floor(Date.now() / 1000.0);
    }

    Startup()
    {
        g_eventSystem.Startup();
        g_windowManager.Startup();
        g_renderer.Startup();
        g_console.Startup();
        g_input.Startup();

        this.m_game = new Game();
    }

    RunFrame()
    {
        Clock.TickSystemClock();

        this.BeginFrame();
        this.Update();
        this.Render();
        this.EndFrame();

        requestAnimationFrame(Main);
    }

    BeginFrame()
    {
        g_eventSystem.BeginFrame();
        g_windowManager.BeginFrame();
        g_renderer.BeginFrame();
        g_console.BeginFrame();
        g_input.BeginFrame();
    }

    Update()
    {
        const deltaSeconds = Clock.SystemClock.GetDeltaSeconds();

        if (g_input.WasKeyJustPressed('Tab'))
        {
            g_console.ToggleMode(DevConsoleMode.OPENFULL);
        }

        this.m_game.Update(deltaSeconds);
    }

    Render()
    {
        this.m_game.Render();

        g_console.Render(new AABB2(Vec2.ZERO, new Vec2(SCREEN_SIZE_Y * g_aspect, SCREEN_SIZE_Y)));
    }

    EndFrame()
    {
        g_input.EndFrame();
        g_console.EndFrame();
        g_renderer.EndFrame();
        g_windowManager.EndFrame();
        g_eventSystem.EndFrame();
    }

    Shutdown()
    {
        g_input.Shutdown();
        g_console.Shutdown();
        g_renderer.Shutdown();
        g_windowManager.Shutdown();
        g_eventSystem.Shutdown();
    }
}
