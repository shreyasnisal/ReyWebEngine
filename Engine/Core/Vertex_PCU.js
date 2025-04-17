"use strict";

import Rgba8 from "/Engine/Core/Rgba8.js"
import Vec2 from "/Engine/Math/Vec2.js"
import Vec3 from "/Engine/Math/Vec3.js"


export default class Vertex_PCU
{
    // The number of Float32 elements this will have = (3 position + 4 color + 2 uv)
    static NUM_FLOAT32_ELEMENTS = 9;

    constructor(position = Vec3.ZERO, color = Rgba8.WHITE, uvTexCoords = Vec2.ZERO)
    {
        this.m_position = new Vec3(position.x, position.y, position.z);
        this.m_color = new Rgba8(color.r, color.g, color.b, color.a);
        this.m_uvTexCoords = new Vec2(uvTexCoords.x, uvTexCoords.y);
    }
}