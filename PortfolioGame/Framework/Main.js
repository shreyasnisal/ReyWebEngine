"use strict";

import { g_app } from "/PortfolioGame/Framework/GameCommon.js";
import { g_windowManager } from "/Engine/Core/EngineCommon.js";


g_app.Startup();
requestAnimationFrame(g_app.RunFrame.bind(g_app));
g_app.Shutdown();

function GetFocus()
{
    g_windowManager.SetFocus(true);
}
