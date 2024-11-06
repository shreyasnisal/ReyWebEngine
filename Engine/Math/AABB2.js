"use strict";

import * as MathUtils from "../../Engine/Math/MathUtils.js"
import Vec2 from "../../Engine/Math/Vec2.js"

export default class AABB2
{
    static ZERO_TO_ONE = new AABB2(new Vec2(0.0, 0.0), new Vec2(1.0, 1.0));

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
        return this.m_mins.GetSum(this.GetDimensions().GetScaled(0.5));
    }

    SetDimensions(newDimensions)
    {
        const currentDimensions = this.GetDimensions();
        this.m_mins.Subtract(newDimensions.GetDifference(currentDimensions));
        this.m_maxs.Add(newDimensions.GetDifference(currentDimensions));
    }

    SetCenter(newCenter)
    {
        const currentCenter = this.GetCenter();
        const translation = newCenter.Subtract(currentCenter);
        this.m_mins.Add(translation);
        this.m_maxs.Add(translation);
    }
}
