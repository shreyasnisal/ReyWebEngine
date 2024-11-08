"use strict";

import Main from "../../Sandbox/Framework/Main.js";
import {g_renderer, g_input, g_console, SCREEN_SIZE_Y} from "../../Sandbox/Framework/GameCommon.js";
import Game from "../../Sandbox/Framework/Game.js";

import Clock from "../../Engine/Core/Clock.js";
import { DevConsoleMode } from "../../Engine/Core/DevConsole.js";
import Vec2 from "../../Engine/Math/Vec2.js";
import AABB2 from "../../Engine/Math/AABB2.js";
import {g_aspect} from "../../Engine/Renderer/Renderer.js";


export default class App
{
    constructor()
    {
        this.m_previousFrameTime = Math.floor(Date.now() / 1000.0);
    }

    Startup()
    {
        g_renderer.Startup();
        g_input.Startup();
        g_console.Startup();

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
        g_renderer.BeginFrame();
        g_input.BeginFrame();
        g_console.BeginFrame();
    }

    Update()
    {
        const deltaSeconds = Clock.SystemClock.GetDeltaSeconds();

        if (g_input.WasKeyJustPressed('C'.charCodeAt()))
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
        g_console.EndFrame();
        g_input.EndFrame();
        g_renderer.EndFrame();
    }

    Shutdown()
    {
        g_console.Shutdown();
        g_input.Shutdown();
        g_renderer.Shutdown();
    }
}
