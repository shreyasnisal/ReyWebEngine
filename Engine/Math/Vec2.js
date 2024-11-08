
import * as MathUtils from "../../Engine/Math/MathUtils.js"

export default class Vec2
{
    static ZERO = new Vec2(0, 0);
    static EAST = new Vec2(1, 0);
    static WEST = new Vec2(-1, 0);
    static NORTH = new Vec2(0, 1);
    static SOUTH = new Vec2(0, -1);

    constructor(x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
    }

    toString()
    {
        return "(" + this.x + "," + this.y + ")";
    }

    static MakeFromPolarDegrees(orientationDegrees, length = 1)
    {
        return new Vec2(length * MathUtils.CosDegrees(orientationDegrees), length * MathUtils.SinDegrees(orientationDegrees));
    }

    Add(vecToAdd)
    {
        this.x += vecToAdd.x;
        this.y += vecToAdd.y;
    }

    GetSum(vecToAdd)
    {
        return new Vec2(this.x + vecToAdd.x, this.y + vecToAdd.y);
    }

    Subtract(vecToSubtract)
    {
        this.x -= vecToSubtract.x;
        this.y -= vecToSubtract.y;
    }

    GetDifference(vecToSubtract)
    {
        return new Vec2(this.x - vecToSubtract.x, this.y - vecToSubtract.y);
    }

    Scale(scalingFactor)
    {
        this.x *= scalingFactor;
        this.y *= scalingFactor;
    }

    GetScaled(scalingFactor)
    {
        return new Vec2(this.x * scalingFactor, this.y * scalingFactor);
    }

    RotateDegrees(deltaDegrees)
    {
        const length = this.GetLength();
        let orientationDegrees = MathUtils.Atan2Degrees(this.y, this.x);
        orientationDegrees += deltaDegrees;
        this.x = length * MathUtils.CosDegrees(orientationDegrees);
        this.y = length * MathUtils.SinDegrees(orientationDegrees);
    }

    GetRotatedDegrees(deltaDegrees)
    {
        const length = this.GetLength();
        let orientationDegrees = MathUtils.Atan2Degrees(this.y, this.x);
        orientationDegrees += deltaDegrees;
        return Vec2.MakeFromPolarDegrees(orientationDegrees, length);
    }

    Rotate90Degrees()
    {

    }

    RotateMinus90Degrees()
    {

    }

    GetLength()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    GetLengthSquared()
    {
        return this.x * this.x + this.y * this.y;
    }

    GetOrientationDegrees()
    {
        return MathUtils.Atan2Degrees(this.y, this.x);
    }

    Normalize()
    {
        const scalingFactor = 1.0 / this.GetLength();
        this.x *= scalingFactor;
        this.y *= scalingFactor;
    }

    GetNormalized()
    {
        const scalingFactor = 1 / this.GetLength();
        return new Vec2(this.x * scalingFactor, this.y * scalingFactor);
    }
}
