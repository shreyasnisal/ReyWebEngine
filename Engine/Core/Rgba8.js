

export default class Rgba8
{
    static WHITE = new Rgba8(255, 255, 255, 255);
    static BLACK = new Rgba8(0, 0, 0, 255);

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