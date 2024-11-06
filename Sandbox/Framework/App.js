"use strict";

import Main from "../../Sandbox/Framework/Main.js";
import { g_renderer, g_input } from "../../Sandbox/Framework/GameCommon.js";
import Game from "../../Sandbox/Framework/Game.js";

import Clock from "../../Engine/Core/Clock.js";


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
    }

    Update()
    {
        const deltaSeconds = Clock.SystemClock.GetDeltaSeconds();

        this.m_game.Update(deltaSeconds);
    }

    Render()
    {
        this.m_game.Render();
    }

    EndFrame()
    {
        g_input.EndFrame();
        g_renderer.EndFrame();
    }

    Shutdown()
    {
        g_input.Shutdown();
        g_renderer.Shutdown();
    }
}
