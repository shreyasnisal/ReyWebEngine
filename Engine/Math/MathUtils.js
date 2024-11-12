"use strict";

import EulerAngles from "/Engine/Math/EulerAngles.js";
import Vec3 from "/Engine/Math/Vec3.js"
import Vec4 from "/Engine/Math/Vec4.js"


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


