"use strict";

import Vec2 from "/Engine/Math/Vec2.js";


export function RollRandomFloatZeroToOne()
{
    return Math.random();
}

export function RollRandomFloatInRange(minInclusive, maxInclusive)
{
    return Math.random() * (maxInclusive - minInclusive) + minInclusive;
}

export function RollRandomFloatUsingFloatRange(numberRange)
{
    return Math.random() * (numberRange.m_max - numberRange.m_min) + numberRange.m_min;
}

export function RollRandomVec2InRange(xMin, xMax, yMin, yMax)
{
    return new Vec2(RollRandomFloatInRange(xMin, xMax), RollRandomFloatInRange(yMin, yMax));
}

export function RollRandomVec2UsingFloatRanges(xRange, yRange)
{
    return new Vec2(RollRandomFloatUsingFloatRange(xRange), RollRandomFloatUsingFloatRange(yRange));
}
