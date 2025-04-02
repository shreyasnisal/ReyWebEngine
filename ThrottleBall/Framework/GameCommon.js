"use strict";

import App from "/ThrottleBall/Framework/App.js";

import Rgba8 from "/Engine/Core/Rgba8.js";


export const g_app = new App();

export const SCREEN_SIZE_Y = 800.0;
export const WORLD_SIZE_Y = 100.0;
export const WORLD_SIZE_X = 200.0;

export const PRIMARY_COLOR = new Rgba8(0, 120, 255);
export const PRIMARY_COLOR_VARIANT_DARK = new Rgba8(0, 90, 200);
export const PRIMARY_COLOR_VARIANT_LIGHT = new Rgba8(80, 160, 255);

export const SECONDARY_COLOR = new Rgba8(220, 50, 50);
export const SECONDARY_COLOR_VARIANT_DARK = new Rgba8(170, 30, 30);
export const SECONDARY_COLOR_VARIANT_LIGHT = new Rgba8(255, 100, 100);

export const TERTIARY_COLOR = new Rgba8(33, 32, 30);
export const TERTIARY_COLOR_VARIANT_DARK = new Rgba8(10, 10, 10);
export const TERTIARY_COLOR_VARIANT_LIGHT = new Rgba8(60, 60, 60);

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

