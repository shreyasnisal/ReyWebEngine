"use strict";

import AABB2 from "../../Engine/Math/AABB2.js"
import Vec2 from "../../Engine/Math/Vec2.js"
import Vec3 from "../../Engine/Math/Vec3.js"
import Vertex_PCU from "../../Engine/Core/Vertex_PCU.js";

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
