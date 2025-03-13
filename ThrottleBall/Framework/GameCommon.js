"use strict";

import App from "/ThrottleBall/Framework/App.js";

import Rgba8 from "/Engine/Core/Rgba8.js";


export const g_app = new App();

export const SCREEN_SIZE_Y = 800.0;
export const WORLD_SIZE_Y = 100.0;
export const WORLD_SIZE_X = 200.0;

export class Team
{
    static PINK = "PINK";
    static PURPLE = "PURPLE";
}

export function GetTeamColor(team)
{
    if (team === Team.PINK)
    {
        return new Rgba8(238, 130, 238, 225);
    }
    else if (team === Team.PURPLE)
    {
        return new Rgba8(106, 90, 205, 225);
    }

    console.error("Attempted to get color for unknown team!");
    return Rgba8.WHITE;
}

export function GetTimeStringFromSeconds(timeInSeconds)
{
    const timeMinutes = Math.floor(timeInSeconds / 60);
    const timeSeconds = timeInSeconds % 60;
    return timeMinutes + ":" + (timeSeconds < 10 ? "0" + timeSeconds : timeSeconds);
}

