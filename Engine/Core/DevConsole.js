"use strict";

import * as VertexUtils from "../../Engine/Core/VertexUtils.js";
import AABB2 from "../../Engine/Math/AABB2.js";
import Vec2 from "../../Engine/Math/Vec2.js";
import Rgba8 from "../../Engine/Core/Rgba8.js";
import {CullMode, DepthMode} from "../../Engine/Renderer/Renderer.js";
import Clock from "../../Engine/Core/Clock.js";


export class DevConsoleConfig
{
    constructor(renderer, camera, fontFilePath, overlayColor = new Rgba8(0, 0, 0, 200), linesToShow = 50.5, fontAspect = 0.7)
    {
        this.m_renderer = renderer;
        this.m_camera = camera;
        this.m_fontFilePath = fontFilePath;
        this.m_overlayColor = overlayColor;
        this.m_linesToShow = linesToShow;
        this.m_fontAspect = fontAspect;
    }
}

export class DevConsoleMode
{
    static HIDDEN = "HIDDEN";
    static OPENFULL = "OPENFULL";
}

class DevConsoleLine
{
    constructor(color, text, frameNumber, timestamp, showTimestempAndFrameNumber = false)
    {
        this.m_color = color;
        this.m_text = text;
        this.m_frameNumber = frameNumber;
        this.m_timestamp = timestamp;
        this.m_showTimestempAndFrameNumber = showTimestempAndFrameNumber;
    }

    toString()
    {
        let lineText = "";
        if (this.m_showTimestempAndFrameNumber)
        {
            lineText += this.m_timestamp + " (Frame #" + this.m_frameNumber + "): ";
        }
        lineText += this.m_text;
        return lineText;
    }
}

export default class DevConsole
{
    static INFO = Rgba8.WHITE;
    static WARNING = Rgba8.YELLOW;
    static ERROR = Rgba8.RED;

    constructor(config)
    {
        this.m_config = config;

        // Initialize variables
        this.m_mode = DevConsoleMode.HIDDEN;
        this.m_blinkingCaretTimer = null;
        this.m_linesToShow = this.m_config.m_linesToShow;
        this.m_frameNumber = 0;
        this.m_isCaretVisible = false;
        this.m_lines = [];
        this.m_command = "";
        this.m_caretPosition = 0;
    }

    Startup()
    {

    }

    BeginFrame()
    {
        this.m_frameNumber++;
        // while (this.m_blinkingCaretTimer.DecrementDurationIfElapsed())
        // {
        //     this.m_isCaretVisible = !this.m_isCaretVisible;
        // }
    }

    Render(bounds, rendererOverride = null)
    {
        let renderer = this.m_config.m_renderer;
        if (rendererOverride != null)
        {
            renderer = rendererOverride;
        }

        renderer.CreateOrGetBitmapFont(this.m_config.m_fontFilePath).then(font =>
        {
            switch (this.m_mode)
            {
                case DevConsoleMode.HIDDEN:
                {
                    return;
                }
                case DevConsoleMode.OPENFULL:
                {
                    this.Render_OpenFull(bounds, renderer, font, this.m_config.m_fontAspect);
                }
            }
        });
    }

    Render_OpenFull(bounds, renderer, font, fontAspect)
    {
        const devConsoleVerts = [];
        const devConsoleTextVerts = [];

        renderer.BeginCamera(this.m_config.m_camera);
        {
            VertexUtils.AddPCUVertsForAABB2(devConsoleVerts, bounds, this.m_config.m_overlayColor);

            const lineHeight = (this.m_config.m_camera.GetOrthoTopRight().y - this.m_config.m_camera.GetOrthoBottomLeft().y) / this.m_linesToShow;
            const numLines = this.m_lines.length;

            VertexUtils.AddPCUVertsForLineSegment2D(devConsoleVerts, new Vec2(bounds.m_mins.x, bounds.m_mins.y + lineHeight * 2.0), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + lineHeight * 2.0), lineHeight * 0.1, Rgba8.DODGER_BLUE);
            font.AddVertsForTextInBox2D(devConsoleTextVerts, new AABB2(bounds.m_mins.GetSum(new Vec2((this.m_config.m_camera.GetOrthoTopRight().x - this.m_config.m_camera.GetOrthoBottomLeft().x) * 0.01, lineHeight * 0.3)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + lineHeight * 1.3)), lineHeight, this.m_command, Rgba8.DODGER_BLUE, fontAspect);

            for (let lineIndex = 0; lineIndex < numLines; lineIndex++)
            {
                const lineBounds = new AABB2(new Vec2(bounds.m_mins.x + (this.m_config.m_camera.GetOrthoTopRight().x - this.m_config.m_camera.GetOrthoBottomLeft().x) * 0.01, bounds.m_mins.y + lineHeight * 1.1 * (numLines - lineIndex + 1)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y + 2.0 + lineHeight * 0.9 * (numLines - lineIndex + 2)));
                if (lineBounds.m_mins.y > bounds.m_maxs.y)
                {
                    break;
                }
                if (lineBounds.m_mins.y < bounds.m_mins + lineHeight * 2.0)
                {
                    continue;
                }
                const lineText = this.m_lines[lineIndex].toString();
                font.AddVertsForTextInBox2D(devConsoleTextVerts, new AABB2(lineBounds.m_mins.GetSum(new Vec2(1.0, -1.0).GetScaled(lineHeight * 0.25)), lineBounds.m_maxs.GetSum(new Vec2(1.0, -1.0).GetScaled(lineHeight * 0.25))), lineHeight, lineText, Rgba8.BLACK, fontAspect);
                font.AddVertsForTextInBox2D(devConsoleTextVerts, lineBounds, lineHeight, lineText, this.m_lines[lineIndex].m_color, fontAspect);
            }
        }

        renderer.SetDepthMode(DepthMode.DISABLED);
        renderer.SetCullMode(CullMode.BACK);
        renderer.SetModelConstants();

        renderer.BindTexture(null);
        renderer.DrawVertexArray(devConsoleVerts);

        renderer.BindTexture(font.GetTexture());
        renderer.DrawVertexArray(devConsoleTextVerts);

        renderer.EndCamera(this.m_config.m_camera);
    }

    EndFrame()
    {
    }

    Shutdown()
    {
    }

    GetMode()
    {
        return this.m_mode;
    }

    SetMode(mode)
    {
        this.m_mode = mode;
    }

    ToggleMode(mode)
    {
        if (this.m_mode === mode)
        {
            this.m_mode = DevConsoleMode.HIDDEN;
        }
        else
        {
            this.m_mode = mode;
        }
    }

    AddLine(color, text, showTimestampAndFrameNumber = false)
    {
        const devConsoleLine = new DevConsoleLine(color, text, this.m_frameNumber, Clock.SystemClock.GetTotalSeconds(), showTimestampAndFrameNumber);
        this.m_lines.push(devConsoleLine);
    }

    AddLine(text, showTimestampAndFrameNumber = false)
    {
        const devConsoleLine = new DevConsoleLine(DevConsole.INFO, text, this.m_frameNumber, Clock.SystemClock.GetTotalSeconds(), showTimestampAndFrameNumber);
        this.m_lines.push(devConsoleLine);
    }
}
