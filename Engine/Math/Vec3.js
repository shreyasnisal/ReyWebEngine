import * as MathUtils from "../../Engine/Math/MathUtils.js"

export default class Vec3
{
    static ZERO = new Vec3(0, 0, 0);
    static EAST = new Vec3(1, 0, 0);
    static WEST = new Vec3(-1, 0, 0);
    static NORTH = new Vec3(0, 1, 0);
    static SOUTH = new Vec3(0, -1, 0);
    static SKYWARD = new Vec3(0, 0, 1);
    static GROUNDWARD = new Vec3(0, 0, -1);

    constructor(x = 0, y = 0, z = 0)
    {
        this.x = x;
        this.y = y;
        this.z = 0;
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