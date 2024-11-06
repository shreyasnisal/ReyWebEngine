

export default class Vec4
{
    static EAST = new Vec4(1, 0, 0, 0);
    static WEST = new Vec4(-1, 0, 0, 0);
    static NORTH = new Vec4(0, 1, 0, 0);
    static SOUTH = new Vec4(0, -1, 0, 0);
    static SKYWARD = new Vec4(0, 0, 1, 0);
    static GROUNDWARD = new Vec4(0, 0, -1, 0);
    static TRANSLATION = new Vec4(0, 0, 0, 1);

    constructor(x = 0, y = 0, z = 0, w = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    Add(vecToAdd)
    {
        this.x += vecToAdd.x;
        this.y += vecToAdd.y;
        this.z += vecToAdd.z;
        this.w += vecToAdd.w;
    }

    GetSum(vecToAdd)
    {
        return new Vec4(this.x + vecToAdd.x, this.y + vecToAdd.y, this.z + vecToAdd.z, this.w + vecToAdd.w);
    }

    Subtract(vecToSubtract)
    {
        this.x -= vecToSubtract.x;
        this.y -= vecToSubtract.y;
        this.z -= vecToSubtract.z;
        this.w -= vecToSubtract.w;
    }

    GetDifference(vecToSubtract)
    {
        return new Vec4(this.x - vecToSubtract.x, this.y - vecToSubtract.y, this.z - vecToSubtract.z, this.w - vecToSubtract.w);
    }

    Scale(scalingFactor)
    {
        this.x *= scalingFactor;
        this.y *= scalingFactor;
        this.z *= scalingFactor;
        this.w *= scalingFactor;
    }

    GetScaled(scalingFactor)
    {
        return new Vec4(this.x * scalingFactor, this.y * scalingFactor, this.z * scalingFactor, this.w * scalingFactor);
    }

    Equals(vecToCompare)
    {
        return (
            this.x == vecToCompare.x &&
            this.y == vecToCompare.y &&
            this.z == vecToCompare.z &&
            this.w == vecToCompare.w
        );
    }

    NotEquals(vecToCompare)
    {
        return (
            this.x != vecToCompare.x ||
            this.y != vecToCompare.y ||
            this.z != vecToCompare.z ||
            this.w != vecToCompare.w
        );
    }

    Assign(copyVec4)
    {
        this.x = copyVec4.x;
        this.y = copyVec4.y;
        this.z = copyVec4.z;
        this.w = copyVec4.w;
    }
}