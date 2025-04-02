"use strict";


import {g_app} from "/ThrottleBall/Framework/GameCommon.js";
import {GameState} from "/ThrottleBall/Framework/Game.js";

import {g_eventSystem} from "/Engine/Core/EngineCommon.js";

export function SubscribeButtonEvents()
{
    g_eventSystem.SubscribeEventCallbackFunction("Navigate", Event_Navigate);
}

function Event_Navigate(args)
{
    const target = args["target"];
    if (target !== GameState.NONE)
    {
        g_app.m_game.m_nextState = target;
    }
}
