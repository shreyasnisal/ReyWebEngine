"use strict";

import Vec2 from "../../Engine/Math/Vec2.js"

export default class Texture
{
    constructor(imageFilePath)
    {
        this.m_name = imageFilePath;
        this.m_dimensions = Vec2.ZERO;
        this.m_texture = null;
    }
}
