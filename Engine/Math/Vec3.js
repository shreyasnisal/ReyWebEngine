"use strict";

import * as StringUtils from "/Engine/Core/StringUtils.js";

import Vec2 from "/Engine/Math/Vec2.js";


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

    SetFromString(vec3Str)
    {
        if (vec3Str == null)
        {
            console.warn("Attempting to set Vec3 from invalid string!");
            return;
        }

        const splitStrings = [];
        StringUtils.SplitStringOnDelimiter(splitStrings, vec3Str, ',', false);
        if (splitStrings.length !== 3)
        {
            console.warn("Invalid number of literals in Vec3 string!");
            return;
        }

        this.x = parseFloat(splitStrings[0]);
        this.y = parseFloat(splitStrings[1]);
        this.z = parseFloat(splitStrings[2]);
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

    GetProduct(vecToMultiply)
    {
        return new Vec3(this.x * vecToMultiply.x, this.y * vecToMultiply.y, this.z * vecToMultiply.z);
    }

    GetLength()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    Normalize()
    {
        const length = this.GetLength();
        if (length === 0)
        {
            return;
        }
        const scalingFactor = 1.0 / length;

        this.x *= scalingFactor;
        this.y *= scalingFactor;
        this.z *= scalingFactor;
    }

    GetNormalized()
    {
        const length = this.GetLength();
        if (length === 0)
        {
            return this;
        }
        const scalingFactor = 1.0 / length;
        return new Vec3(this.x * scalingFactor, this.y * scalingFactor, this.z * scalingFactor);
    }

    GetXY()
    {
        return new Vec2(this.x, this.y);
    }
}