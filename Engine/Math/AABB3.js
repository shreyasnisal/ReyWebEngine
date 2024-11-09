"use strict";

import Vec3 from "/Engine/Math/Vec3.js"


export default class AABB3
{
    constructor(mins = Vec3.ZERO, maxs = Vec3.ZERO)
    {
        this.m_mins = mins;
        this.m_maxs = maxs;
    }

    GetDimensions()
    {
        return this.m_maxs.GetDifference(this.m_mins);
    }

    GetCenter()
    {
        return this.m_mins.GetSum(this.GetDimensions().GetScaled(0.5));
    }

    SetDimensions(newDimensions)
    {
    }

    SetCenter(newCenter)
    {
    }
}