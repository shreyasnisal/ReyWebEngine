"use strict";

import AABB2 from "../../Engine/Math/AABB2.js";


export default class SpriteDefinition
{
    constructor(spriteSheet = null, spriteIndex = -1, uvCoords = AABB2.ZERO_TO_ONE)
    {
        this.m_spriteSheet = spriteSheet;
        this.m_spriteIndex = spriteIndex;
        this.m_uvCoords = uvCoords;
    }

    GetUVs()
    {
        return this.m_uvCoords;
    }

    GetSpriteSheet()
    {
        return this.m_spriteSheet;
    }

    GetTexture()
    {
        return this.m_spriteSheet.GetTexture();
    }
}

