"use strict";

import App from "/ThrottleBall/Framework/App.js";

import Rgba8 from "/Engine/Core/Rgba8.js";


export const g_app = new App();

export const SCREEN_SIZE_Y = 800.0;
export const WORLD_SIZE_Y = 100.0;
export const WORLD_SIZE_X = 200.0;
export const ASPECT = WORLD_SIZE_X / WORLD_SIZE_Y;

export const PRIMARY_COLOR = new Rgba8(0, 120, 255);
export const PRIMARY_COLOR_VARIANT_DARK = new Rgba8(0, 90, 200);
export const PRIMARY_COLOR_VARIANT_LIGHT = new Rgba8(80, 160, 255);

export const SECONDARY_COLOR = new Rgba8(220, 50, 50);
export const SECONDARY_COLOR_VARIANT_DARK = new Rgba8(170, 30, 30);
export const SECONDARY_COLOR_VARIANT_LIGHT = new Rgba8(255, 100, 100);

export const TERTIARY_COLOR = new Rgba8(33, 32, 30);
export const TERTIARY_COLOR_VARIANT_DARK = new Rgba8(10, 10, 10);
export const TERTIARY_COLOR_VARIANT_LIGHT = new Rgba8(60, 60, 60);

export const SHADOW_COLOR = new Rgba8(0, 0, 0, 127);
export const SHADOW_OFFSET_X = 0.75;
export const SHADOW_OFFSET_Y = 0.75;

export class Team
{
    static NONE = "NONE";
    static BLUE = "BLUE";
    static RED = "RED";
}

export function GetTeamString(team)
{
    if (team === Team.BLUE)
    {
        return "Blue"
    }
    else if (team === Team.RED)
    {
        return "Red";
    }

    console.error("Attempted to get string for unknown team!");
    return "None";
}

export function GetTeamColor(team)
{
    if (team === Team.BLUE)
    {
        return new Rgba8(38, 141, 198, 225);
    }
    else if (team === Team.RED)
    {
        return new Rgba8(226, 97, 17, 225);
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

export const CAR_IMAGE_PATHS =
    [
        // Blue car choices
        "/ThrottleBall/Data/Images/BlueCars/car_blue_1.png",
        "/ThrottleBall/Data/Images/BlueCars/car_blue_2.png",
        "/ThrottleBall/Data/Images/BlueCars/car_blue_3.png",
        "/ThrottleBall/Data/Images/BlueCars/car_blue_4.png",
        "/ThrottleBall/Data/Images/BlueCars/car_blue_5.png",

        // Red car choices
        "/ThrottleBall/Data/Images/RedCars/car_red_1.png",
        "/ThrottleBall/Data/Images/RedCars/car_red_2.png",
        "/ThrottleBall/Data/Images/RedCars/car_red_3.png",
        "/ThrottleBall/Data/Images/RedCars/car_red_4.png",
        "/ThrottleBall/Data/Images/RedCars/car_red_5.png"
    ];

export const NUM_CAR_CHOICES = 10;

export function GetTeamFromCarImageIndex(carImageIndex)
{
    if (carImageIndex < NUM_CAR_CHOICES / 2)
    {
        return Team.BLUE;
    }
    else if (carImageIndex < NUM_CAR_CHOICES)
    {
        return Team.RED;
    }

    console.error("Attempted to get team for invalid car image index!");
    return Team.NONE;
}

