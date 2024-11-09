"use strict";

import AABB2 from "/Engine/Math/AABB2.js"
import Vec2 from "/Engine/Math/Vec2.js"
import Vec3 from "/Engine/Math/Vec3.js"
import Vertex_PCU from "/Engine/Core/Vertex_PCU.js";


export function TransformVertexArrayXY3D(verts, uniformScaleXY, rotationDegreesAboutZ, translation)
{

}

export function TransformVertexArray3D(verts, transform)
{
    for (let vertexIndex = 0; vertexIndex < verts.length; vertexIndex++)
    {
        verts[vertexIndex].m_position = transform.TransformPosition3D(verts[vertexIndex].m_position);
    }
}

export function AddPCUVertsForLineSegment2D(verts, start, end, thickness, color)
{
    const fwdNormal = end.GetDifference(start).GetNormalized();
    const leftNormal = fwdNormal.GetRotated90Degrees();

    const  vertex1Position = start.GetDifference((fwdNormal.GetSum(leftNormal)).GetScaled(thickness));
    const  vertex2Position = start.GetDifference((fwdNormal.GetDifference(leftNormal)).GetScaled(thickness));
    const  vertex3Position = end.GetSum((fwdNormal.GetDifference(leftNormal)).GetScaled(thickness));
    const  vertex4Position = end.GetSum((fwdNormal.GetSum(leftNormal)).GetScaled(thickness));

    const vertex1 = new Vertex_PCU(vertex1Position.GetAsVec3(), color, Vec2.ZERO);
    const vertex2 = new Vertex_PCU(vertex2Position.GetAsVec3(), color, Vec2.ZERO);
    const vertex3 = new Vertex_PCU(vertex3Position.GetAsVec3(), color, Vec2.ZERO);
    const vertex4 = new Vertex_PCU(vertex4Position.GetAsVec3(), color, Vec2.ZERO);

    verts.push(vertex1);
    verts.push(vertex3);
    verts.push(vertex4);

    verts.push(vertex1);
    verts.push(vertex4);
    verts.push(vertex2);
}

export function AddPCUVertsForAABB2(verts, bounds, color, uvCoords = AABB2.ZERO_TO_ONE)
{
    const vertexBLPosition = bounds.m_mins;
    const vertexBRPosition = new Vec2(bounds.m_maxs.x, bounds.m_mins.y);
    const vertexTRPosition = bounds.m_maxs;
    const vertexTLPosition = new Vec2(bounds.m_mins.x, bounds.m_maxs.y);

    const vertexBL = new Vertex_PCU(vertexBLPosition.GetAsVec3(), color, uvCoords.m_mins);
    const vertexBR = new Vertex_PCU(vertexBRPosition.GetAsVec3(), color, new Vec2(uvCoords.m_maxs.x, uvCoords.m_mins.y));
    const vertexTR = new Vertex_PCU(vertexTRPosition.GetAsVec3(), color, uvCoords.m_maxs);
    const vertexTL = new Vertex_PCU(vertexTLPosition.GetAsVec3(), color, new Vec2(uvCoords.m_mins.x, uvCoords.m_maxs.y));

    verts.push(vertexBL);
    verts.push(vertexBR);
    verts.push(vertexTR);

    verts.push(vertexBL);
    verts.push(vertexTR);
    verts.push(vertexTL);
}

export function AddPCUVertsForQuad3D(verts, bottomLeftPosition, bottomRightPosition, topRightPosition, topLeftPosition, color, uvCoords = AABB2.ZERO_TO_ONE)
{
    const bottomLeftVertex = new Vertex_PCU(bottomLeftPosition, color, uvCoords.m_mins);
    const bottomRightVertex = new Vertex_PCU(bottomRightPosition, color, new Vec2(uvCoords.m_maxs.x, uvCoords.m_mins.y));
    const topRightVertex = new Vertex_PCU(topRightPosition, color, uvCoords.m_maxs);
    const topLeftVertex = new Vertex_PCU(topLeftPosition, color, new Vec2(uvCoords.m_mins.x, uvCoords.m_maxs.y));

    verts.push(bottomLeftVertex);
    verts.push(bottomRightVertex);
    verts.push(topRightVertex);

    verts.push(bottomLeftVertex);
    verts.push(topRightVertex);
    verts.push(topLeftVertex);
}

export function AddPCUVertsForAABB3(verts, bounds, color, uvCoords = AABB2.ZERO_TO_ONE)
{
    const mins = bounds.m_mins;
    const maxs = bounds.m_maxs;

    const BLF = new Vec3(mins.x, maxs.y, mins.z);
    const BRF = new Vec3(mins.x, mins.y, mins.z);
    const TRF = new Vec3(mins.x, mins.y, maxs.z);
    const TLF = new Vec3(mins.x, maxs.y, maxs.z);
    const BLB = new Vec3(maxs.x, maxs.y, mins.z);
    const BRB = new Vec3(maxs.x, mins.y, mins.z);
    const TRB = new Vec3(maxs.x, mins.y, maxs.z);
    const TLB = new Vec3(maxs.x, maxs.y, maxs.z);

    AddPCUVertsForQuad3D(verts, BRB, BLB, TLB, TRB, color, uvCoords); // +X
    AddPCUVertsForQuad3D(verts, BLF, BRF, TRF, TLF, color, uvCoords); // -X
    AddPCUVertsForQuad3D(verts, BLB, BLF, TLF, TLB, color, uvCoords); // +Y
    AddPCUVertsForQuad3D(verts, BRF, BRB, TRB, TRF, color, uvCoords); // -Y
    AddPCUVertsForQuad3D(verts, TLF, TRF, TRB, TLB, color, uvCoords); // +Z
    AddPCUVertsForQuad3D(verts, BLB, BRB, BRF, BLF, color, uvCoords); // -Z
}
