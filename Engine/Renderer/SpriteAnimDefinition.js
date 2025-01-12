"use strict";

import * as MathUtils from "/Engine/Math/MathUtils.js";


export class SpriteAnimPlaybackType
{
    static ONCE = "ONCE";
    static LOOP = "LOOP";
    static PINGPONG = "PINGPONG";
}

export default class SpriteAnimDefinition
{
    constructor(spriteSheet, startSpriteIndex, endSpriteIndex, durationSeconds, playbackMode = SpriteAnimPlaybackType.LOOP)
    {
        this.m_spriteSheet = spriteSheet;
        this.m_startSpriteIndex = startSpriteIndex;
        this.m_endSpriteIndex = endSpriteIndex;
        this.m_durationSeconds = durationSeconds;
        this.m_playbackMode = playbackMode;
    }

    GetSpriteDefAtTime(seconds)
    {
        let spriteOffset = MathUtils.RoundDownToInt((seconds / this.m_durationSeconds) * (this.m_endSpriteIndex - this.m_startSpriteIndex + 1));

        if (this.m_playbackMode === SpriteAnimPlaybackType.ONCE)
        {
            spriteOffset = MathUtils.RoundDownToInt(MathUtils.GetClamped(spriteOffset, 0.0, this.m_endSpriteIndex - this.m_startSpriteIndex));
        }
        else if (this.m_playbackMode === SpriteAnimPlaybackType.LOOP)
        {
            const numSprites = this.m_endSpriteIndex - this.m_startSpriteIndex + 1;
            spriteOffset = spriteOffset % numSprites;
        }
        else if (this.m_playbackMode === SpriteAnimPlaybackType.PINGPONG)
        {
            const numSprites = this.m_endSpriteIndex - this.m_startSpriteIndex + 1;
            spriteOffset = spriteOffset % (numSprites * 2 - 2);

            if (spriteOffset >= numSprites)
            {
                spriteOffset = (numSprites - 1) * 2 - spriteOffset;
            }
        }

        return this.m_spriteSheet.GetSpriteDef(this.m_startSpriteIndex + spriteOffset);
    }

    GetDuration()
    {
        return this.m_durationSeconds;
    }

    GetPlaybackMode()
    {
        return this.m_playbackMode;
    }

    GetTexture()
    {
        return this.m_spriteSheet.GetTexture();
    }
};
