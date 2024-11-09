"use strict";

export default class Rgba8
{
    static WHITE = Object.freeze(new Rgba8(255, 255, 255, 255));
    static BLACK = Object.freeze(new Rgba8(0, 0, 0, 255));
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

    constructor(r = 255, g = 255, b = 255, a = 255)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    ToRgbaString()
    {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`;
    }

    GetAsFloats()
    {
        return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
    }

    static Interpolate(startColor, endColor, fractionTowardsEnd)
    {
        
    }
}
