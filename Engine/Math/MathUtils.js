"use strict";

import AABB2 from "/Engine/Math/AABB2.js"
import AABB3 from "/Engine/Math/AABB3.js";
import EulerAngles from "/Engine/Math/EulerAngles.js";
import NumberRange from "/Engine/Math/NumberRange.js";
import Vec3 from "/Engine/Math/Vec3.js";
import Vec4 from "/Engine/Math/Vec4.js";


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

export function IsPointInsideDisc2D(referencePoint, discCenter, discRadius)
{
    return GetDistanceSquared2D(referencePoint, discCenter) < (discRadius * discRadius);
}

export function DoDiscAndAABB2Overlap(discCenter, discRadius, box)
{
    const nearestPointOnBox = box.GetNearestPoint(discCenter);
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

export function EaseOutQuadratic(t)
{
    const tFlipped = 1.0 - t;
    const outFlipped = tFlipped * tFlipped;
    return 1.0 - outFlipped;
}
