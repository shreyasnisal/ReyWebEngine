"use strict";


export default class Vec3
{
    static ZERO = Object.freeze(new Vec3(0, 0, 0));
    static EAST = Object.freeze(new Vec3(1, 0, 0));
    static WEST = Object.freeze(new Vec3(-1, 0, 0));
    static NORTH = Object.freeze(new Vec3(0, 1, 0));
    static SOUTH = Object.freeze(new Vec3(0, -1, 0));
    static SKYWARD = Object.freeze(new Vec3(0, 0, 1));
    static GROUNDWARD = Object.freeze(new Vec3(0, 0, -1));

    constructor(x = 0, y = 0, z = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toString()
    {
        return "(" + this.x + "," + this.y + "," + this.z + ")";
    }

    Add(vecToAdd)
    {
        this.x += vecToAdd.x;
        this.y += vecToAdd.y;
        this.z += vecToAdd.z;
    }

    GetSum(vecToAdd)
    {
        return new Vec3(this.x + vecToAdd.x, this.y + vecToAdd.y, this.z + vecToAdd.z);
    }

    Subtract(vecToSubtract)
    {
        this.x -= vecToSubtract.x;
        this.y -= vecToSubtract.y;
        this.z -= vecToSubtract.z;
    }

    GetDifference(vecToSubtract)
    {
        return new Vec3(this.x - vecToSubtract.x, this.y - vecToSubtract.y, this.z - vecToSubtract.z);
    }

    Scale(scalingFactor)
    {
        this.x *= scalingFactor;
        this.y *= scalingFactor;
        this.z *= scalingFactor;
    }

    GetScaled(scalingFactor)
    {
        return new Vec3(this.x * scalingFactor, this.y * scalingFactor, this.z * scalingFactor);
    }
}