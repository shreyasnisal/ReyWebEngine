"use strict";

import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js"


export default class AABB2
{
    static ZERO_TO_ONE = Object.freeze(new AABB2(new Vec2(0.0, 0.0), new Vec2(1.0, 1.0)));

    constructor(mins = new Vec2(), maxs = new Vec2())
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

    GetPointAtUVs(uvCoords)
    {
        const dimensions = this.GetDimensions();
        return new Vec2(this.m_mins.x + uvCoords.x * dimensions.x, this.m_mins.y + uvCoords.y * dimensions.y);
    }

    GetBoxAtUVs(uvMins, uvMaxs)
    {
        const pointAtUVMins = this.GetPointAtUVs(uvMins);
        const pointAtUVMaxs = this.GetPointAtUVs(uvMaxs);
        return new AABB2(pointAtUVMins, pointAtUVMaxs);
    }

    GetNearestPoint(referencePoint)
    {
        return new Vec2(MathUtils.GetClamped(referencePoint.x, this.m_mins.x, this.m_maxs.x), MathUtils.GetClamped(referencePoint.y, this.m_mins.y, this.m_maxs.y));
    }

    IsPointInside(referencePoint)
    {
        return (referencePoint.x > this.m_mins.x && referencePoint.x < this.m_maxs.x && referencePoint.y > this.m_mins.y && referencePoint.y < this.m_maxs.y);
    }

    SetDimensions(newDimensions)
    {
        const currentDimensions = this.GetDimensions();
        const deltaWidth = newDimensions.x - currentDimensions.x;
        const deltaHeight = newDimensions.y - currentDimensions.y;
        this.m_mins.x -= deltaWidth * 0.5;
        this.m_maxs.x += deltaWidth * 0.5;
        this.m_mins.y -= deltaHeight * 0.5;
        this.m_maxs.y += deltaHeight * 0.5;
    }

    SetCenter(newCenter)
    {
        const currentCenter = this.GetCenter();
        const translation = newCenter.Subtract(currentCenter);
        this.m_mins.Add(translation);
        this.m_maxs.Add(translation);
    }

    Translate(translationXY)
    {
        this.m_mins.Add(translationXY);
        this.m_maxs.Add(translationXY);
    }
}
