"use strict";

import * as StringUtils from "/Engine/Core/StringUtils.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";
import AABB2 from "/Engine/Math/AABB2.js";
import Mat44 from "/Engine/Math/Mat44.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";
import SpriteSheet from "/Engine/Renderer/SpriteSheet.js";


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

    AddVertsForTextInBox2D(verts, box, cellHeight, text, tint, cellAspect, alignment = Vec2.ZERO, mode = TextBoxMode.SHRINK_TO_FIT, maxGlyphsToDraw = 999999)
    {
        const lines = [];
        const numLines = StringUtils.SplitStringOnDelimiter(lines, text, '\n');
        let textDimensions = new Vec2();
        for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
        {
            const lineWidth = this.GetTextWidth(cellHeight, lines[lineIndex], cellAspect);
            if (lineWidth > textDimensions.x)
            {
                textDimensions.x = lineWidth;
            }
        }
        textDimensions.y = numLines * cellHeight;

        const boxDimensions = box.GetDimensions();

        if (mode === TextBoxMode.SHRINK_TO_FIT)
        {
            const scalingFactorX = boxDimensions.x / textDimensions.x;
            const scalingFactorY = boxDimensions.y / textDimensions.y;

            if (scalingFactorX <= scalingFactorY && scalingFactorX < 1.0)
            {
                cellHeight *= scalingFactorX;
                textDimensions.Scale(scalingFactorX);
            }
            else if (scalingFactorY < scalingFactorX && scalingFactorY < 1.0)
            {
                cellHeight *= scalingFactorY;
                textDimensions.Scale(scalingFactorY);
            }
        }

        const textStartPosition = box.m_mins.GetSum(boxDimensions.GetDifference(textDimensions).GetVectorProduct(alignment));

        let glyphsDrawn = 0;
        for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
        {
            if (glyphsDrawn >= maxGlyphsToDraw)
            {
                break;
            }

            let textToDraw = lines[lineIndex];
            if (glyphsDrawn + lines[lineIndex].length > maxGlyphsToDraw)
            {
                textToDraw = textToDraw.substring(0, maxGlyphsToDraw - glyphsDrawn);
            }
            const lineWidth = this.GetTextWidth(cellHeight, lines[lineIndex], cellAspect);
            const lineStartPosition = textStartPosition.GetSum(new Vec2((textDimensions.x - lineWidth) * alignment.x, cellHeight * (numLines - lineIndex - 1)));
            this.AddVertsForText2D(verts, lineStartPosition, cellHeight, textToDraw, tint, cellAspect);
            glyphsDrawn += lines[lineIndex].length;
        }
    }

    AddVertsForText3D(verts, textMins, cellHeight, text, tint, cellAspect, alignment, maxGlyphsToDraw)
    {
        this.AddVertsForTextInBox2D(verts, new AABB2(new Vec2(0.0, 0.0), new Vec2(1.0, 1.0)), cellHeight, text, tint, Vec2.ZERO, TextBoxMode.OVERRUN, maxGlyphsToDraw);
        const origin = new Vec3(0.0, textMins.x - this.GetTextWidth(cellHeight, text, cellAspect) * alignment.x, textMins.y - cellHeight * alignment.y);
        const transform = new Mat44(Vec3.NORTH, Vec3.SKYWARD, Vec3.EAST, origin);
        VertexUtils.TransformVertexArray3D(verts, transform);
    }
}

