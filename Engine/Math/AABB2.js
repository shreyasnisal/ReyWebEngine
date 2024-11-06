
import * as MathUtils from "../../Engine/Math/MathUtils.js"
import Vec2 from "../../Engine/Math/Vec2.js"

export default class AABB2
{
    constructor(mins = Vec2.ZERO, maxs = Vec2.ZERO)
    {
        this.m_mins = mins;
        this.m_maxs = maxs;
    }

    GetDimensions()
    {
        return new Vec2(this.m_maxs.x - this.m_mins.x, this.m_maxs.y - this.m_mins.y);
    }

    GetCenter()
    {
        return this.m_mins.GetSum(GetDimensions().GetScaled(0.5));
    }

    SetDimensions(newDimensions)
    {
        currentDimensions = this.GetDimensions();
        this.m_mins.Subtract(newDimensions.GetDifference(currentDimensions));
        this.m_maxs.Add(newDimensions.GetDifference(currentDimensions));
    }

    SetCenter(newCenter)
    {
        const currentCenter = GetCenter();
        const translation = newCenter.Subtract(currentCenter);
        this.m_mins.Add(translation);
        this.m_maxs.Add(translation);
    }
}
