"use strict";

import Vec2 from "/Engine/Math/Vec2.js";


export default class OBB2
{
    constructor(center = Vec2.ZERO, iBasisNormal = Vec2.ZERO, halfDimensions = Vec2.ZERO)
    {
        this.m_center = new Vec2(center.x, center.y);
        this.m_iBasisNormal = new Vec2(iBasisNormal.x, iBasisNormal.y);
        this.m_halfDimensions = new Vec2(halfDimensions.x, halfDimensions.y);
    }

    GetCornerPoints()
    {
        const jBasisNormal = this.m_iBasisNormal.GetRotated90Degrees();
        const cornerPoints = [];
        cornerPoints[0] = this.m_center.GetDifference(this.m_iBasisNormal.GetScaled(this.m_halfDimensions.x)).GetDifference(jBasisNormal.GetScaled(this.m_halfDimensions.y));
        cornerPoints[1] = this.m_center.GetSum(this.m_iBasisNormal.GetScaled(this.m_halfDimensions.x)).GetDifference(jBasisNormal.GetScaled(this.m_halfDimensions.y));
        cornerPoints[2] = this.m_center.GetSum(this.m_iBasisNormal.GetScaled(this.m_halfDimensions.x)).GetSum(jBasisNormal.GetScaled(this.m_halfDimensions.y));
        cornerPoints[3] = this.m_center.GetDifference(this.m_iBasisNormal.GetScaled(this.m_halfDimensions.x)).GetSum(jBasisNormal.GetScaled(this.m_halfDimensions.y));
        return cornerPoints;
    }
}
