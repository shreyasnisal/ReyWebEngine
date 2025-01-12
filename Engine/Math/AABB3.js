"use strict";

import * as StringUtils from "/Engine/Core/StringUtils.js";

import Vec3 from "/Engine/Math/Vec3.js"


export default class AABB3
{
    constructor(mins = Vec3.ZERO, maxs = Vec3.ZERO)
    {
        this.m_mins = new Vec3(mins.x, mins.y, mins.z);
        this.m_maxs = new Vec3(maxs.x, maxs.y, maxs.z);
    }

    toString()
    {

    }

    SetFromString(aabb3Str)
    {
        const splitStrings = [];
        StringUtils.SplitStringOnDelimiter(splitStrings, aabb3Str, ',', false);
        if (splitStrings.length !== 6)
        {
            console.warn("Invalid number of literals in AABB3 string!");
            return;
        }

        this.m_mins = new Vec3(parseFloat(splitStrings[0]), parseFloat(splitStrings[1]), parseFloat(splitStrings[2]));
        this.m_maxs = new Vec3(parseFloat(splitStrings[3]), parseFloat(splitStrings[4]), parseFloat(splitStrings[5]));
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
        const width = (this.m_maxs.x - this.m_mins.x);
        const height = (this.m_maxs.y - this.m_mins.y);
        const depth = (this.m_maxs.z - this.m_mins.z);
        this.m_mins.x = newCenter.x - width * 0.5;
        this.m_maxs.x = newCenter.x + width * 0.5;
        this.m_mins.y = newCenter.y - height * 0.5;
        this.m_maxs.y = newCenter.y + height * 0.5;
        this.m_mins.z = newCenter.z - depth * 0.5;
        this.m_maxs.z = newCenter.z + depth * 0.5;
    }
}