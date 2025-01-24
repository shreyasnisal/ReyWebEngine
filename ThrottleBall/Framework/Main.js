"use strict";

import { g_app } from "/Sandbox/Framework/GameCommon.js";
import { g_windowManager } from "/Engine/Core/EngineCommon.js";


// export default function Main()
// {
//     g_app.RunFrame();
//     requestAnimationFrame(Main);
// }

g_app.Startup();
requestAnimationFrame(g_app.RunFrame.bind(g_app));
g_app.Shutdown();

function GetFocus()
{
    g_windowManager.SetFocus(true);
}
