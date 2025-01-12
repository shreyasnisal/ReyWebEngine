"use strict";

import * as StringUtils from "/Engine/Core/StringUtils.js";

import * as MathUtils from "/Engine/Math/MathUtils.js";


export default class Rgba8
{
    static WHITE = Object.freeze(new Rgba8(255, 255, 255, 255));
    static BLACK = Object.freeze(new Rgba8(0, 0, 0, 255));
    static TRANSPARENT_BLACK = Object.freeze(new Rgba8(0, 0, 0, 0));
    static GRAY = Object.freeze(new Rgba8(127, 127, 127, 255));
    static RED = Object.freeze(new Rgba8(255, 0, 0, 255));
    static LIME = Object.freeze(new Rgba8(0, 255, 0, 255));
    static BLUE = Object.freeze(new Rgba8(0, 0, 255, 255));
    static GREEN = Object.freeze(new Rgba8(0, 127, 0, 255));
    static MAGENTA = Object.freeze(new Rgba8(255, 0, 255, 255));
    static FUCHSIA = Object.freeze(new Rgba8(255, 0, 255, 255));
    static YELLOW = Object.freeze(new Rgba8(255, 255, 0, 255));
    static CYAN = Object.freeze(new Rgba8(0, 255, 255, 255));
    static TEAL = Object.freeze(new Rgba8(0, 255, 255, 255));
    static DODGER_BLUE = Object.freeze(new Rgba8(30, 144, 255, 255));
    static DEEP_SKY_BLUE = Object.freeze(new Rgba8(0, 191, 255, 255));

    constructor(r = 255, g = 255, b = 255, a = 255)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString()
    {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`;
    }

    SetFromString(rgbaStr)
    {
        let splitStrings = [];
        StringUtils.SplitStringOnDelimiter(splitStrings, rgbaStr, ',', false);
        if (splitStrings.length !== 3 && splitStrings.length !== 4)
        {
            console.warn("Invalid number of literals in Rgba8 string!");
            return;
        }

        this.r = parseInt(splitStrings[0]);
        this.g = parseInt(splitStrings[1]);
        this.b = parseInt(splitStrings[2]);
        if (splitStrings.length === 3)
        {
            this.a = 255;
        }
        else
        {
            this.a = parseInt(splitStrings[3]);
        }
    }

    Equals(colorToCompare)
    {
        return this.r === colorToCompare.r && this.g === colorToCompare.g && this.b === colorToCompare.b && this.a === colorToCompare.a;
    }

    GetAsFloats()
    {
        return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
    }

    static Lerp(startColor, endColor, fractionTowardsEnd)
    {
        let red = MathUtils.Lerp(startColor.r, endColor.r, fractionTowardsEnd);
        red = MathUtils.RoundDownToInt(red);

        let green = MathUtils.Lerp(startColor.g, endColor.g, fractionTowardsEnd);
        green = MathUtils.RoundDownToInt(green);

        let blue = MathUtils.Lerp(startColor.b, endColor.b, fractionTowardsEnd);
        blue = MathUtils.RoundDownToInt(blue);

        let alpha = MathUtils.Lerp(startColor.a, endColor.a, fractionTowardsEnd);
        alpha = MathUtils.RoundDownToInt(alpha);

        return new Rgba8(red, green, blue, alpha);
    }
}
