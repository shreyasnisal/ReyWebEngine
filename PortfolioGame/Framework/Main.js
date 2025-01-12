"use strict";

import { g_app } from "/PortfolioGame/Framework/GameCommon.js";
import { g_windowManager, g_input } from "/Engine/Core/EngineCommon.js";

let g_hasViewedContent = sessionStorage.getItem("viewedContent");

g_app.Startup();
if (g_hasViewedContent || g_input.IsTouchSupported())
{
    DestroyCanvasAndShowContent();
}
else
{
    requestAnimationFrame(g_app.RunFrame.bind(g_app));
    g_app.Shutdown();
}

function GetFocus()
{
    g_windowManager.SetFocus(true);
}

export function DestroyCanvasAndShowContent()
{
    const contentDOMElement = document.getElementById("website-content");
    const canvas = document.getElementById("id_canvas");

    if (g_input != null)
    {
        g_input.SetCursorMode(false, false);
    }

    if (g_app != null)
    {
        g_app.Shutdown();
    }
    canvas.style.display = "none";
    contentDOMElement.style.display = "block";

    sessionStorage.setItem("viewedContent", "true");
}
