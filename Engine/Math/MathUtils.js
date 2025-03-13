"use strict";

import AABB2 from "/Engine/Math/AABB2.js"
import AABB3 from "/Engine/Math/AABB3.js";
import EulerAngles from "/Engine/Math/EulerAngles.js";
import NumberRange from "/Engine/Math/NumberRange.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vec4 from "/Engine/Math/Vec4.js";

// Trig and Angles
//------------------------------------------------------------------------------------------------------------
export function ConvertDegreesToRadians(degrees)
{
    return degrees * Math.PI / 180;
}

export function ConvertRadiansToDegrees(radians)
{
    return radians * 180 / Math.PI;
}

export function CosDegrees(degrees)
{
    const radians = ConvertDegreesToRadians(degrees);
    return Math.cos(radians);
}

export function SinDegrees(degrees)
{
    const radians = ConvertDegreesToRadians(degrees);
    return Math.sin(radians);
}

export function TanDegrees(degrees)
{
    const radians = ConvertDegreesToRadians(degrees);
    return Math.tan(radians);
}

export function Atan2Degrees(y, x)
{
    const radians = Math.atan2(y, x);
    return ConvertRadiansToDegrees(radians);
}

export function GetShortestAngularDispDegrees(startDegrees, endDegrees)
{
    while (startDegrees > 360.0)
    {
        startDegrees -= 360.0;
    }
    while (endDegrees > 360.0)
    {
        endDegrees -= 360.0;
    }

    let angularDisplacement = endDegrees - startDegrees;
    if (angularDisplacement > 180.0)
    {
        angularDisplacement -= 360.0;
    }
    else if (angularDisplacement < -180.0)
    {
        angularDisplacement += 360.0;
    }

    return angularDisplacement;
}

export function GetTurnedTowardDegrees(currentDegrees, goalDegrees, maxDeltaDegrees)
{
    while (currentDegrees > 360.0)
    {
        currentDegrees -= 360.0;
    }
    while (goalDegrees > 360.0)
    {
        goalDegrees -= 360.0;
    }

    let turnedDegrees = currentDegrees;
    const shortestAngularDisplacement = GetShortestAngularDispDegrees(currentDegrees, goalDegrees);
    if (shortestAngularDisplacement > 0)
    {
        turnedDegrees += GetClamped(shortestAngularDisplacement, 0, maxDeltaDegrees);
    }
    else
    {
        turnedDegrees -= GetClamped(Math.abs(shortestAngularDisplacement), 0, maxDeltaDegrees);
    }

    return turnedDegrees;
}
//------------------------------------------------------------------------------------------------------------

export function NormalizeByte(byteToNormalize)
{
    return byteToNormalize / 255;
}

export function GetClamped(value, minValue, maxValue)
{
    if (value < minValue)
    {
        value = minValue;
    }
    else if (value > maxValue)
    {
        value = maxValue;
    }

    return value;
}

export function GetClampedZeroToOne(value)
{
    if (value < 0)
    {
        return 0;
    }
    else if (value > 1)
    {
        return 1;
    }

    return value;
}

export function Lerp(start, end, fractionTowardsEnd)
{
    return start + (end - start) * fractionTowardsEnd;
}

export function InverseLerp(value, start, end)
{
    return (value - start) / (end - start);
}

export function RangeMap(inValue, inStart, inEnd, outStart, outEnd)
{
    const fractionForLerp = InverseLerp(inValue, inStart, inEnd);
    return Lerp(outStart, outEnd, fractionForLerp);
}

export function RangeMapClamped(inValue, inStart, inEnd, outStart, outEnd)
{
    let fractionForLerp = InverseLerp(inValue, inStart, inEnd);
    fractionForLerp = GetClampedZeroToOne(fractionForLerp);
    return Lerp(outStart, outEnd, fractionForLerp);
}

export function RoundDownToInt(value)
{
    return Math.floor(value);
}

// Vector Operations
//------------------------------------------------------------------------------------------------------------
export function DotProduct2D(vecA, vecB)
{
    return vecA.x * vecB.x + vecA.y * vecB.y;
}

export function DotProduct3D(vecA, vecB)
{
    return vecA.x * vecB.x + vecA.y * vecB.y + vecA.z * vecB.z;
}

export function DotProduct4D(vecA, vecB)
{
    return vecA.x * vecB.x + vecA.y * vecB.y + vecA.z * vecB.z + vecA.w * vecB.w;
}

export function CrossProduct2D(vecA, vecB)
{
    return vecA.x * vecB.y - vecA.y * vecB.x;
}

export function CrossProduct3D(vecA, vecB)
{
    return new Vec3(
        vecA.y * vecB.z - vecA.z * vecB.y,
        vecA.z * vecB.x - vecA.x * vecB.z,
        vecA.x * vecB.y - vecA.y * vecB.x
    );
}

export function GetProjectedLength2D(vectorToProject, vectorToProjectOnto)
{
    const normalToProjectOnto = vectorToProjectOnto.GetNormalized();
    return DotProduct2D(vectorToProject, normalToProjectOnto);
}

export function GetProjectedOnto2D(vectorToProject, vectorToProjectOnto)
{
    const normalToProjectOnto = vectorToProjectOnto.GetNormalized();
    const projectedLength = DotProduct2D(vectorToProject, normalToProjectOnto);
    return normalToProjectOnto.GetScaled(projectedLength);
}
//------------------------------------------------------------------------------------------------------------

export function GetEulerAnglesFromQuaternion(quaternionX, quaternionY, quaternionZ, quaternionW)
{
    const quaternionLength = new Vec4(quaternionX, quaternionY, quaternionZ, quaternionW).GetLength();
    if (quaternionLength === 0.0)
    {
        return new EulerAngles();
    }

    const normalizedQX = quaternionX / quaternionLength;
    const normalizedQY = quaternionY / quaternionLength;
    const normalizedQZ = quaternionZ / quaternionLength;
    const normalizedQW = quaternionW / quaternionLength;

    // Roll
    const sinR_cosP = 2.0 * (normalizedQW * normalizedQX + normalizedQY * normalizedQZ);
    const cosR_cosP = 1.0 - 2.0 * (normalizedQX * normalizedQX + normalizedQY * normalizedQY);
    const roll = Math.atan2(sinR_cosP, cosR_cosP);

    // Pitch
    const sinP = 2.0 * (normalizedQW * normalizedQY - normalizedQZ * normalizedQX);
    let pitch;
    if (Math.abs(sinP) >= 1.0)
    {
        pitch = Math.abs(Math.PI / 2.0) * Math.sign(sinP);
    }
    else
    {
        pitch = Math.asin(sinP);
    }

    // Yaw
    const sinY_cosP = 2.0 * (normalizedQW * normalizedQZ + normalizedQX * normalizedQY);
    const cosY_cosP = 1.0 - 2.0 * (normalizedQY * normalizedQY + normalizedQZ * normalizedQZ);
    const yaw = Math.atan2(sinY_cosP, cosY_cosP);

    return new EulerAngles(ConvertRadiansToDegrees(yaw), ConvertRadiansToDegrees(pitch), ConvertRadiansToDegrees(roll));
}

// Distances
//------------------------------------------------------------------------------------------------------------
export function GetDistance2D(vecA, vecB)
{
    return Math.sqrt(
        ((vecB.x - vecA.x) * (vecB.x - vecA.x)) +
           ((vecB.y - vecA.y) * (vecB.y - vecA.y))
    );
}

export function GetDistanceSquared2D(vecA, vecB)
{
    return (
        ((vecB.x - vecA.x) * (vecB.x - vecA.x)) +
        ((vecB.y - vecA.y) * (vecB.y - vecA.y))
    );
}

export function GetDistance3D(vecA, vecB)
{
    return Math.sqrt(
        ((vecB.x - vecA.x) * (vecB.x - vecA.x)) +
        ((vecB.y - vecA.y) * (vecB.y - vecA.y)) +
        ((vecB.z - vecA.z) * (vecB.z - vecA.z))
    )
}

export function GetDistanceSquared3D(vecA, vecB)
{
    return (
        ((vecB.x - vecA.x) * (vecB.x - vecA.x)) +
        ((vecB.y - vecA.y) * (vecB.y - vecA.y)) +
        ((vecB.z - vecA.z) * (vecB.z - vecA.z))
    )
}
//------------------------------------------------------------------------------------------------------------

// IsPointInside
//------------------------------------------------------------------------------------------------------------
export function IsPointInsideDisc2D(referencePoint, discCenter, discRadius)
{
    return GetDistanceSquared2D(referencePoint, discCenter) < (discRadius * discRadius);
}

export function IsPointInsideAABB2(referencePoint, box)
{
    return (referencePoint.x > box.m_mins.x && referencePoint.x < box.m_maxs.x && referencePoint.y > box.m_mins.y && referencePoint.y < box.m_maxs.y);
}
//------------------------------------------------------------------------------------------------------------

// Nearest Points
//------------------------------------------------------------------------------------------------------------
export function GetNearestPointOnAABB2(referencePoint, box)
{
    return box.GetNearestPoint(referencePoint);
}

export function GetNearestPointOnOBB2(referencePoint, orientedBox)
{
    const iBasisNormal = orientedBox.m_iBasisNormal;
    const jBasisNormal = iBasisNormal.GetRotated90Degrees();

    const referencePointInOBBLocalSpace = orientedBox.GetLocalPosForWorldPos(referencePoint);
    const OBB2InLocalSpace = new AABB2(orientedBox.m_halfDimensions.GetScaled(-1.0), orientedBox.m_halfDimensions);

    const nearestPointInOBBLocalSpace = GetNearestPointOnAABB2(referencePointInOBBLocalSpace, OBB2InLocalSpace);
    const nearestPointInWorldSpace = orientedBox.GetWorldPosForLocalPos(nearestPointInOBBLocalSpace);

    return nearestPointInWorldSpace;
}
//------------------------------------------------------------------------------------------------------------

// Overlaps
//------------------------------------------------------------------------------------------------------------
export function DoDiscAndAABB2Overlap(discCenter, discRadius, box)
{
    const nearestPointOnBox = box.GetNearestPoint(discCenter);
    return IsPointInsideDisc2D(nearestPointOnBox, discCenter, discRadius);
}

export function DoDiscAndOBB2Overlap(discCenter, discRadius, box)
{
    const nearestPointOnBox = GetNearestPointOnOBB2(discCenter, box);
    return IsPointInsideDisc2D(nearestPointOnBox, discCenter, discRadius);
}

export function DoAABB3AndCylinerOverlap(box, cylinderBaseCenter, cylinderTopCenter, cylinderRadius)
{
    if (!DoDiscAndAABB2Overlap(cylinderBaseCenter.GetXY(), cylinderRadius, new AABB2(box.m_mins.GetXY(), box.m_maxs.GetXY())))
    {
        return false;
    }
    const cylinderZRange = new NumberRange(cylinderBaseCenter.z, cylinderTopCenter.z);
    const boxZRange = new NumberRange(box.m_mins.z, box.m_maxs.z);
    return cylinderZRange.IsOverlappingWith(boxZRange);
}
//------------------------------------------------------------------------------------------------------------

// Push Out Operations
//------------------------------------------------------------------------------------------------------------
export function PushDiscOutOfFixedPoint2D(mobileDiscCenter, mobileDiscRadius, fixedPoint)
{
    if (!IsPointInsideDisc2D(fixedPoint, mobileDiscCenter, mobileDiscRadius))
    {
        return false;
    }

    const pushDistance = mobileDiscRadius - GetDistance2D(fixedPoint, mobileDiscCenter);
    const pushDirection = mobileDiscCenter.GetDifference(fixedPoint).GetNormalized();

    mobileDiscCenter.Add(pushDirection.GetScaled(pushDistance));

    return true;
}

export function PushDiscOutOfFixedOBB2(mobileDiscCenter, mobileDiscRadius, fixedOrientedBox)
{
    const nearestPointOnOrientedBox = GetNearestPointOnOBB2(mobileDiscCenter, fixedOrientedBox);
    return PushDiscOutOfFixedPoint2D(mobileDiscCenter, mobileDiscRadius, nearestPointOnOrientedBox);
}

export function PushDiscAndOBB2OutOffEachOther(mobileDiscCenter, mobileDiscRadius, mobileOrientedBox)
{
    const nearestPointOnOrientedBox = GetNearestPointOnOBB2(mobileDiscCenter, mobileOrientedBox);
    if (!IsPointInsideDisc2D(nearestPointOnOrientedBox, mobileDiscCenter, mobileDiscRadius))
    {
        return false;
    }

    const pushDistance = mobileDiscRadius - GetDistance2D(nearestPointOnOrientedBox, mobileDiscCenter) * 0.5;
    const pushDirection = mobileDiscCenter.GetDifference(nearestPointOnOrientedBox).GetNormalized();

    mobileDiscCenter.Add(pushDirection.GetScaled(pushDistance));
    mobileOrientedBox.m_center.Add(pushDirection.GetScaled(-pushDistance));

    return true;
}

export function DoOBB2Overlap(obb1, obb2)
{
    const separatingAxes = [obb1.m_iBasisNormal, obb1.m_iBasisNormal.GetRotated90Degrees(), obb2.m_iBasisNormal, obb2.m_iBasisNormal.GetRotated90Degrees()];

    for (let axisIndex = 0; axisIndex < separatingAxes.length; axisIndex++)
    {
        const obb1ProjectionRangeOnAxis = obb1.GetNumberRangeForCornerPointsProjectedOntoAxis(separatingAxes[axisIndex]);
        const obb2ProjectionRangeOnAxis = obb2.GetNumberRangeForCornerPointsProjectedOntoAxis(separatingAxes[axisIndex]);
        const overlap = Math.min(obb1ProjectionRangeOnAxis.m_max, obb2ProjectionRangeOnAxis.m_max) - Math.max(obb1ProjectionRangeOnAxis.m_min, obb2ProjectionRangeOnAxis.m_min);
        if (overlap <= 0.0)
        {
            // Found a separating axis, no overlap
            return false;
        }
    }

    return true;
}

export function PushOBB2OutOfEachOther(obb1, obb2)
{
    const separatingAxes = [obb1.m_iBasisNormal, obb1.m_iBasisNormal.GetRotated90Degrees(), obb2.m_iBasisNormal, obb2.m_iBasisNormal.GetRotated90Degrees()];

    let minOverlapDistance = Infinity;
    let pushAxis = null;

    for (let axisIndex = 0; axisIndex < separatingAxes.length; axisIndex++)
    {
        const obb1ProjectionRangeOnAxis = obb1.GetNumberRangeForCornerPointsProjectedOntoAxis(separatingAxes[axisIndex]);
        const obb2ProjectionRangeOnAxis = obb2.GetNumberRangeForCornerPointsProjectedOntoAxis(separatingAxes[axisIndex]);
        const overlap = Math.min(obb1ProjectionRangeOnAxis.m_max, obb2ProjectionRangeOnAxis.m_max) - Math.max(obb1ProjectionRangeOnAxis.m_min, obb2ProjectionRangeOnAxis.m_min);
        if (overlap <= 0.0)
        {
            // Found a separating axis, no overlap
            return false;
        }
        if (overlap < minOverlapDistance)
        {
            minOverlapDistance = overlap;
            pushAxis = separatingAxes[axisIndex];
        }
    }

    const directionForObb2 = new Vec2(obb2.m_center.x - obb1.m_center.x, obb2.m_center.y - obb1.m_center.y);
    const directionProjectedOntoPushAxis = DotProduct2D(directionForObb2, pushAxis);
    const pushDistance = directionProjectedOntoPushAxis < 0.0 ? -minOverlapDistance : minOverlapDistance;

    obb2.m_center.x += pushAxis.x * pushDistance * 0.5;
    obb2.m_center.y += pushAxis.y * pushDistance * 0.5;

    obb1.m_center.x -= pushAxis.x * pushDistance * 0.5;
    obb1.m_center.y -= pushAxis.y * pushDistance * 0.5;
    
    return true;
}

export function PushZCylinderOutOfFixedAABB3(cylinderBaseCenter, cylinderTopCenter, cylinderRadius, box)
{
    const topViewBox2D = new AABB2(box.m_mins.GetXY(), box.m_maxs.GetXY());
    if (!DoDiscAndAABB2Overlap(cylinderBaseCenter.GetXY(), cylinderRadius, topViewBox2D))
    {
        return false;
    }

    const cylinderZRange = new NumberRange(cylinderBaseCenter.z, cylinderTopCenter.z);
    const boxZRange = new NumberRange(box.m_mins.z, box.m_maxs.z);

    if (!cylinderZRange.IsOverlappingWith(boxZRange))
    {
        return false;
    }

    const nearestPointOnTopViewBox2D = topViewBox2D.GetNearestPoint(cylinderBaseCenter.GetXY());
    const topViewPushDistance = cylinderRadius - GetDistance2D(nearestPointOnTopViewBox2D, cylinderBaseCenter.GetXY());

    const downwardPushDistance = Math.abs(cylinderZRange.m_max - boxZRange.m_min);
    const upwardPushDistance = Math.abs(cylinderZRange.m_min - boxZRange.m_max);
    let verticalPushDistance = upwardPushDistance;
    let verticalPushDirection = Vec3.SKYWARD;
    if (upwardPushDistance > downwardPushDistance)
    {
        verticalPushDistance = downwardPushDistance;
        verticalPushDirection = Vec3.GROUNDWARD;
    }

    const horizontalPushDir = cylinderBaseCenter.GetXY().GetDifference(nearestPointOnTopViewBox2D).GetAsVec3().GetNormalized();
    if (verticalPushDistance < topViewPushDistance)
    {
        cylinderBaseCenter.Add(verticalPushDirection.GetScaled(verticalPushDistance));
        cylinderTopCenter.Add(verticalPushDirection.GetScaled(verticalPushDistance));

        return true;
    }

    cylinderBaseCenter.Add(horizontalPushDir.GetScaled(topViewPushDistance));
    cylinderTopCenter.Add(horizontalPushDir.GetScaled(topViewPushDistance));

    return true;
}
//------------------------------------------------------------------------------------------------------------

// Velocity Convergence/Divergence
//------------------------------------------------------------------------------------------------------------
export function AreVelocitiesConverging2D(velocityA, velocityB, normalAToB)
{
    const normalVelocityA = GetProjectedLength2D(velocityA, normalAToB);
    const normalVelocityB = GetProjectedLength2D(velocityB, normalAToB);

    const relativeVelocityAlongNormalBWrtA = normalVelocityB - normalVelocityA;
    return (relativeVelocityAlongNormalBWrtA < 0.0);
}

export function AreVelocitiesDiverging2D(velocityA, velocityB, normalAToB)
{
    return !AreVelocitiesConverging2D(velocityA, velocityB, normalAToB);
}
//------------------------------------------------------------------------------------------------------------

// Bounce Operations
//------------------------------------------------------------------------------------------------------------
export function BounceDiscAndOBB2OffEachOther(mobileDiscCenter, mobileDiscRadius, mobileDiscMass, mobileDiscVelocity, mobileDiscElasticity, mobileOrientedBox, mobileBoxMass, mobileBoxVelocity, mobileBoxElasticity)
{
    if (!DoDiscAndOBB2Overlap(mobileDiscCenter, mobileDiscRadius, mobileOrientedBox))
    {
        return false;
    }

    const collisionElasticity = mobileDiscElasticity * mobileBoxElasticity;

    const mobileDiscMomentum = mobileDiscVelocity.GetScaled(mobileDiscMass);
    const mobileBoxMomentum = mobileBoxVelocity.GetScaled(mobileBoxMass);
    const centerOfMassVelocity = mobileDiscMomentum.GetSum(mobileBoxMomentum).GetScaled(1.0 / (mobileDiscMass + mobileBoxMass));

    const mobileDiscVelocityInCoMFrame = mobileDiscVelocity.GetDifference(centerOfMassVelocity);
    const mobileBoxVelocityInCoMFrame = mobileBoxVelocity.GetDifference(centerOfMassVelocity);
    const mobileDiscMomentumInCoMFrame = mobileDiscVelocityInCoMFrame.GetScaled(mobileDiscMass);
    const mobileBoxMomentumInCoMFrame = mobileBoxVelocityInCoMFrame.GetScaled(mobileBoxMass);

    const nearestPointOnBox = GetNearestPointOnOBB2(mobileDiscCenter, mobileOrientedBox);
    const directionDiscToPoint = nearestPointOnBox.GetDifference(mobileDiscCenter).GetNormalized();

    const mobileDiscNormalMomentumInCoMFrame = GetProjectedOnto2D(mobileDiscMomentumInCoMFrame, directionDiscToPoint);
    const mobileDiscTangentMomentumInCoMFrame = mobileDiscMomentumInCoMFrame.GetDifference(mobileDiscNormalMomentumInCoMFrame);

    const mobileBoxNormalMomentumInCoMFrame = GetProjectedOnto2D(mobileBoxMomentumInCoMFrame, directionDiscToPoint.GetScaled(-1.0));
    const mobileBoxTangentMomentumInCoMFrame = mobileBoxMomentumInCoMFrame.GetDifference(mobileBoxNormalMomentumInCoMFrame);

    PushDiscAndOBB2OutOffEachOther(mobileDiscCenter, mobileDiscRadius, mobileOrientedBox);

    if (AreVelocitiesDiverging2D(mobileDiscVelocity, mobileBoxVelocity, directionDiscToPoint))
    {
        return true;
    }

    const mobileDiscFinalNormalMomentumInCoMFrame = new Vec2(mobileBoxNormalMomentumInCoMFrame.x, mobileBoxNormalMomentumInCoMFrame.y).GetScaled(collisionElasticity);
    const mobileDiscFinalMomentumInCoMFrame = mobileDiscTangentMomentumInCoMFrame.GetSum(mobileDiscFinalNormalMomentumInCoMFrame);
    const mobileDiscFinalVelocityInCoMFrame = mobileDiscFinalMomentumInCoMFrame.GetScaled(1.0 / mobileDiscMass);
    const mobileDiscFinalVelocity = mobileDiscFinalVelocityInCoMFrame.GetSum(centerOfMassVelocity);
    mobileDiscVelocity.x = mobileDiscFinalVelocity.x;
    mobileDiscVelocity.y = mobileDiscFinalVelocity.y;

    const mobileBoxFinalNormalMomentumInCoMFrame = new Vec2(mobileDiscNormalMomentumInCoMFrame.x, mobileDiscNormalMomentumInCoMFrame.y).GetScaled(collisionElasticity);
    const mobileBoxFinalMomentumInCoMFrame = mobileBoxTangentMomentumInCoMFrame.GetSum(mobileBoxFinalNormalMomentumInCoMFrame);
    const mobileBoxFinalVelocityInCoMFrame = mobileBoxFinalMomentumInCoMFrame.GetScaled(1.0 / mobileBoxMass);
    const mobileBoxFinalVelocity = mobileBoxFinalVelocityInCoMFrame.GetSum(centerOfMassVelocity);
    mobileBoxVelocity.x = mobileBoxFinalVelocity.x;
    mobileBoxVelocity.y = mobileBoxFinalVelocity.y;

    return true;
}
//------------------------------------------------------------------------------------------------------------

// Easing
//------------------------------------------------------------------------------------------------------------
export function EaseOutQuadratic(t)
{
    const tFlipped = 1.0 - t;
    const outFlipped = tFlipped * tFlipped;
    return 1.0 - outFlipped;
}
//------------------------------------------------------------------------------------------------------------
