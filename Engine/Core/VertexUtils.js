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
