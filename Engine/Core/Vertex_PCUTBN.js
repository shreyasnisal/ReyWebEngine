"use strict";

import Rgba8 from "/Engine/Core/Rgba8.js";
import Vec2 from "/Engine/Math/Vec2.js"
import Vec3 from "/Engine/Math/Vec3.js"

export default class Vertex_PCUTBN
{
    // The number of Float32 elements this will have (3 position + 4 color + 2 uv + 3 tangent + 3 bitangent + 3 normal)
    static NUM_FLOAT32_ELEMENTS = 18;

    constructor(position = Vec3.ZERO, color = Rgba8.WHITE, uvTexCoords = Vec2.ZERO, tangent = Vec3.ZERO, bitangent = Vec3.ZERO, normal = Vec3.ZERO)
    {
        this.m_position = position;
        this.m_color = color;
        this.m_uvTexCoords = uvTexCoords;
        this.m_tangent = tangent;
        this.m_bitangent = bitangent;
        this.m_normal = normal;
    }
}
