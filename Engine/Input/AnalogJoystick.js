"use strict";

import * as MathUtils from "../../Engine/Math/MathUtils.js";
import Vec2 from "../../Engine/Math/Vec2.js";


export default class AnalogJoystick
{
    constructor()
    {
        this.m_rawPosition = Vec2.ZERO;
        this.m_deadzoneCorrectedCartesianCoordinates = Vec2.ZERO;
        this.m_deadzoneCorrectedPolarR = 0.0;
        this.m_orientation = 0.0;
        this.m_innerDeadzoneThreshold = 0.3;
        this.m_outerDeadzoneThreshold = 0.95;
    }

    UpdatePosition(rawNormalizedX, rawNormalizedY)
    {
        this.m_rawPosition = new Vec2(rawNormalizedX, rawNormalizedY);
        const rawNormalizedMagnitude = this.m_rawPosition.GetLength();
        this.m_deadzoneCorrectedPolarR = MathUtils.RangeMapClamped(rawNormalizedMagnitude, this.m_innerDeadzoneThreshold, this.m_outerDeadzoneThreshold, 0.0, 1.0);
        this.m_orientation = this.m_rawPosition.GetOrientationDegrees();
        this.m_deadzoneCorrectedCartesianCoordinates = Vec2.MakeFromPolarDegrees(this.m_orientation, this.m_deadzoneCorrectedPolarR);
    }

    Reset()
    {
        this.m_rawPosition = Vec2.ZERO;
        this.m_deadzoneCorrectedCartesianCoordinates = Vec2.ZERO;
        this.m_deadzoneCorrectedPolarR = 0.0;
        this.m_orientation = 0.0;
    }

    SetDeadzoneThresholds(innerDeadzoneThreshold, outerDeadzoneThreshold)
    {
        this.m_innerDeadzoneThreshold = innerDeadzoneThreshold;
        this.m_outerDeadzoneThreshold = outerDeadzoneThreshold;
    }
}

