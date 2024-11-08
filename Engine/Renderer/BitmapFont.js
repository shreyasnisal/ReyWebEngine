"use strict";

import * as VertexUtils from "../../Engine/Core/VertexUtils.js";
import AABB2 from "../../Engine/Math/AABB2.js";
import Vec2 from "../../Engine/Math/Vec2.js";
import SpriteSheet from "../../Engine/Renderer/SpriteSheet.js";


export class TextBoxMode
{
    static SHRINK_TO_FIT = "SHRINK_TO_FIT";
    static OVERRUN = "OVERRUN";
}

export default class BitmapFont
{
    constructor(fontFilePathWithNoExtension, fontTexture)
    {
        this.m_fontFilePathWithNoExtension = fontFilePathWithNoExtension;
        this.m_fontGlyphsSpriteSheet = new SpriteSheet(fontTexture, new Vec2(16, 16));
    }

    GetTexture()
    {
        return this.m_fontGlyphsSpriteSheet.GetTexture();
    }

    AddVertsForText2D(verts, textMins, cellHeight, text, tint, cellAspect)
    {
        const characterMins = textMins;
        for (let characterIndex = 0; characterIndex < text.length; characterIndex++)
        {
            const characterBox = new AABB2(characterMins, characterMins.GetSum(new Vec2(cellHeight * cellAspect, cellHeight)));
            const spriteUVs = this.m_fontGlyphsSpriteSheet.GetSpriteUVs(text.charCodeAt(characterIndex));
            VertexUtils.AddPCUVertsForAABB2(verts, characterBox, tint, spriteUVs);
            characterMins.Add(new Vec2(cellHeight * cellAspect, 0.0));
        }
    }

    GetTextWidth(cellHeight, text, cellAspect)
    {
        return cellHeight * cellAspect * text.length;
    }
}

