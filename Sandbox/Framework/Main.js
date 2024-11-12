"use strict";

import { g_app } from "/Sandbox/Framework/GameCommon.js";
import {g_renderer, g_webXR, g_windowManager} from "/Engine/Core/EngineCommon.js";


export default function Main()
{
    if (!g_webXR.m_initialized)
    {
        g_app.RunFrame();
        requestAnimationFrame(Main);
    }
    else
    {
        g_webXR.m_xrSession.requestAnimationFrame(g_app.RunXRFrame.bind(g_app));
    }
}

g_app.Startup();
requestAnimationFrame(Main);
g_app.Shutdown();

function GetFocus()
{
    g_windowManager.SetFocus(true);
}
