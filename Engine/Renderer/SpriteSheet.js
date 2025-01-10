"use strict";

import AABB2 from "/Engine/Math/AABB2.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import SpriteDefinition from "/Engine/Renderer/SpriteDefinition.js";


export default class SpriteSheet
{
    constructor(texture = null, simpleGridLayout = Vec2.ZERO)
    {
        this.m_texture = texture;
        this.m_simpleGridLayout = simpleGridLayout;
        const numSprites = simpleGridLayout.x * simpleGridLayout.y;
        this.m_spriteDefs = [];
        for (let spriteIndex = 0; spriteIndex < numSprites; spriteIndex++)
        {
            const minsX = spriteIndex % simpleGridLayout.x;
            const minsY = simpleGridLayout.y - 1.0 - MathUtils.RoundDownToInt(spriteIndex / simpleGridLayout.x);

            const samplingCorrectionFactorX = 1.0 / texture.m_dimensions.x;
            const samplingCorrectionFactorY = 1.0 / texture.m_dimensions.y;

            let uvAtMinsX = minsX / simpleGridLayout.x;
            let uvAtMaxsX = uvAtMinsX + (1.0 / simpleGridLayout.x);
            let uvAtMinsY = minsY / simpleGridLayout.y;
            let uvAtMaxsY = uvAtMinsY + (1.0 / simpleGridLayout.y);

            uvAtMinsX += samplingCorrectionFactorX;
            uvAtMaxsX -= samplingCorrectionFactorX;
            uvAtMinsY += samplingCorrectionFactorY;
            uvAtMaxsY -= samplingCorrectionFactorY;

            this.m_spriteDefs.push(new SpriteDefinition(this, spriteIndex, new AABB2(new Vec2(uvAtMinsX, uvAtMinsY), new Vec2(uvAtMaxsX, uvAtMaxsY))));
        }
    }

    GetTexture()
    {
        return this.m_texture;
    }

    GetNumSprites()
    {
        return this.m_spriteDefs.length;
    }

    GetSpriteUVs(spriteIndex)
    {
        return this.m_spriteDefs[spriteIndex].GetUVs();
    }

    GetSpriteDef(spriteIndex)
    {
        return this.m_spriteDefs[spriteIndex];
    }
}
