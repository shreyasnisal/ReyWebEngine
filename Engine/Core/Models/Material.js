"use strict";

import Rgba8 from "/Engine/Core/Rgba8.js";


export default class Material
{
    static DEFAULT = Object.freeze(new Material());

    constructor(color = Rgba8.WHITE, texture = null)
    {
        this.m_texture = texture;
        this.m_color = color;
    }

    GetTexture()
    {
        return this.m_texture;
    }

    GetColor()
    {
        return this.m_color;
    }
}

