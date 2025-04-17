"use strict";

import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import NumberRange from "/Engine/Math/NumberRange.js"


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
        const iStep = this.m_iBasisNormal.GetScaled(this.m_halfDimensions.x);
        const jStep = jBasisNormal.GetScaled(this.m_halfDimensions.y);
        cornerPoints[0] = this.m_center.GetDifference(iStep).GetDifference(jStep);
        cornerPoints[1] = this.m_center.GetSum(iStep).GetDifference(jStep);
        cornerPoints[2] = this.m_center.GetSum(iStep).GetSum(jStep);
        cornerPoints[3] = this.m_center.GetDifference(iStep).GetSum(jStep);
        return cornerPoints;
    }

    GetLocalPosForWorldPos(worldPos)
    {
        const jBasisNormal = this.m_iBasisNormal.GetRotated90Degrees();

        const displacementCenterToPoint = worldPos.GetDifference(this.m_center);
        const localX = MathUtils.GetProjectedLength2D(displacementCenterToPoint, this.m_iBasisNormal);
        const localY = MathUtils.GetProjectedLength2D(displacementCenterToPoint, jBasisNormal);

        return new Vec2(localX, localY);
    }

    GetWorldPosForLocalPos(localPos)
    {
        const jBasisNormal = this.m_iBasisNormal.GetRotated90Degrees();
        const worldPos = this.m_center.GetSum(this.m_iBasisNormal.GetScaled(localPos.x)).GetSum(jBasisNormal.GetScaled(localPos.y));

        return worldPos;
    }

    GetNumberRangeForCornerPointsProjectedOntoAxis(projectionAxis)
    {
        let resultNumberRange = new NumberRange();
        resultNumberRange.m_min = Infinity;
        resultNumberRange.m_max = -Infinity;

        const cornerPoints = this.GetCornerPoints();
        for (let cornerIndex = 0; cornerIndex < cornerPoints.length; cornerIndex++)
        {
            const cornerProjectionLength = MathUtils.GetProjectedLength2D(cornerPoints[cornerIndex], projectionAxis);
            if (cornerProjectionLength < resultNumberRange.m_min)
            {
                resultNumberRange.m_min = cornerProjectionLength;
            }
            if (cornerProjectionLength > resultNumberRange.m_max)
            {
                resultNumberRange.m_max = cornerProjectionLength;
            }
        }

        return resultNumberRange;
    }
}
