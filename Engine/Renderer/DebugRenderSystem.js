"use strict";

import {g_eventSystem, g_renderer} from "../Core/EngineCommon.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";

import { TextBoxMode } from "/Engine/Renderer/BitmapFont.js";
import { BlendMode, CullMode, DepthMode } from "/Engine/Renderer/Renderer.js";


export class DebugRenderConfig
{
    constructor(bitmapFontFilePathWithNoExtension, messageHeightFractionOfScreen = 0.02)
    {
        this.m_bitmapFontFilePathWithNoExtension = bitmapFontFilePathWithNoExtension;
        this.m_messageHeightFractionOfScreen = messageHeightFractionOfScreen;
    }
}

class DebugGeometryType
{
    static POINT = "POINT";
    static LINE = "LINE";
    static ARROW = "ARROW";
    static BILLBOARD_TEXT = "BILLBOARD_TEXT";
    static SCREEN_TEXT = "SCREEN_TEXT";
    static MESSAGE = "MESSAGE";
}

class DebugRenderMode
{
    static USE_DEPTH = "USE_DEPTH";
    static ALWAYS = "ALWAYS";
    static XRAY = "XRAY";
}

class DebugGeometry
{
    constructor(debugGeometryType)
    {
        this.m_debugGeometryType = debugGeometryType;
        this.m_vertexes = [];
        this.m_startColor = Rgba8.WHITE;
        this.m_endColor = Rgba8.WHITE;
        this.m_debugRenderMode = DebugRenderMode.USE_DEPTH;
        this.m_durationTimer = null;
        this.m_texture = null;
        this.m_translation = Vec2.ZERO;
    }
}

class DebugMessage
{
    constructor(text, durationTimer = null, startColor = Rgba8.WHITE, endColor = Rgba8.WHITE)
    {
        this.m_text = text;
        this.m_durationTimer = durationTimer;
        this.m_startColor = startColor;
        this.m_endColor = endColor;
    }
}

export default class DebugRenderSystem
{
    constructor(config)
    {
        this.m_config = config;
        this.m_visible = true;
        this.m_debugRenderSystemFont = null;
        this.m_worldGeometry = [];
        this.m_screenGeometry = [];
        this.m_messages = [];
    }

    Startup()
    {
        g_renderer.CreateOrGetBitmapFont(this.m_config.m_bitmapFontFilePathWithNoExtension).then(font => {
            this.m_debugRenderSystemFont = font;
        });
        g_eventSystem.SubscribeEventCallbackFunction("debugrenderclear", this.Clear, "Clear all debug elements");
        g_eventSystem.SubscribeEventCallbackFunction("debugrendertoggle", this.ToggleVisible, "Toggles debug element visibility");
    }

    BeginFrame()
    {
        for (let worldGeometryIndex = 0; worldGeometryIndex < this.m_worldGeometry.length; worldGeometryIndex++)
        {
            if (this.m_worldGeometry[worldGeometryIndex].m_durationTimer && this.m_worldGeometry[worldGeometryIndex].m_durationTimer.HasDurationElapsed())
            {
                this.m_worldGeometry.splice(worldGeometryIndex, 1);
                worldGeometryIndex--;
            }
        }

        for (let screenGeometryIndex = 0; screenGeometryIndex < this.m_screenGeometry.length; screenGeometryIndex++)
        {
            if (this.m_screenGeometry[screenGeometryIndex].m_durationTimer && this.m_screenGeometry[screenGeometryIndex].m_durationTimer.HasDurationElapsed())
            {
                this.m_screenGeometry.splice(screenGeometryIndex, 1);
                screenGeometryIndex--;
            }
        }

        for (let messageIndex = 0; messageIndex < this.m_messages.length; messageIndex++)
        {
            if (this.m_messages[messageIndex].m_durationTimer && this.m_messages[messageIndex].m_durationTimer.HasDurationElapsed())
            {
                this.m_messages.splice(messageIndex, 1);
                messageIndex--;
            }
        }
    }

    EndFrame() {}

    Shutdown() {}

    RenderWorld(worldCamera)
    {
        g_renderer.BeginCamera(worldCamera);
        {
        }
        g_renderer.EndCamera(worldCamera);
    }

    RenderScreen(screenCamera)
    {
        if (this.m_debugRenderSystemFont == null)
        {
            return;
        }

        if (!this.m_visible)
        {
            return;
        }

        g_renderer.BeginCamera(screenCamera);
        {
            // Render screen text
            for (let screenGeometryIndex = 0; screenGeometryIndex < this.m_screenGeometry.length; screenGeometryIndex++)
            {
                const screenGeometry = this.m_screenGeometry[screenGeometryIndex];
                const geometryColor = screenGeometry.m_durationTimer ? Rgba8.Lerp(screenGeometry.m_startColor, screenGeometry.m_endColor, screenGeometry.m_durationTimer.GetElapsedFraction()) : screenGeometry.m_startColor;
                g_renderer.SetBlendMode(BlendMode.ALPHA);
                g_renderer.SetCullMode(CullMode.BACK);
                g_renderer.SetDepthMode(DepthMode.DISABLED);
                g_renderer.SetModelConstants();
                g_renderer.BindTexture(screenGeometry.m_texture);
                g_renderer.DrawVertexArray(screenGeometry.m_vertexes);
            }

            const textVerts = [];
            const messageHeight = (screenCamera.GetOrthoTopRight().y - screenCamera.GetOrthoBottomLeft().y) * this.m_config.m_messageHeightFractionOfScreen;
            const messageTextMins = new Vec2((screenCamera.GetOrthoTopRight().x - screenCamera.GetOrthoBottomLeft().x) * 0.01, screenCamera.GetOrthoTopRight().y - messageHeight);

            // Render messages with infinite duration
            for (let messageIndex = this.m_messages.length - 1; messageIndex >= 0; messageIndex--)
            {
                const message = this.m_messages[messageIndex];
                if (message.m_durationTimer != null)
                {
                    continue;
                }
                const textColor = message.m_startColor;
                messageTextMins.y -= messageHeight;
                if (messageTextMins.y < screenCamera.GetOrthoBottomLeft().y)
                {
                    break;
                }
                this.m_debugRenderSystemFont.AddVertsForText2D(textVerts, messageTextMins, messageHeight, message.m_text, textColor, 0.7);
            }

            // Render messages with finite duration
            for (let messageIndex = this.m_messages.length - 1; messageIndex >= 0; messageIndex--)
            {
                const message = this.m_messages[messageIndex];
                if (message.m_durationTimer == null)
                {
                    continue;
                }
                const textColor = Rgba8.Lerp(message.m_startColor, message.m_endColor, message.m_durationTimer.GetElapsedFraction());
                messageTextMins.y -= messageHeight;
                if (messageTextMins.y < screenCamera.GetOrthoBottomLeft().y)
                {
                    break;
                }
                this.m_debugRenderSystemFont.AddVertsForText2D(textVerts, messageTextMins, messageHeight, message.m_text, textColor, 0.7);
            }

            g_renderer.SetBlendMode(BlendMode.ALPHA);
            g_renderer.SetDepthMode(DepthMode.DISABLED);
            g_renderer.SetCullMode(CullMode.BACK);
            g_renderer.SetModelConstants();
            g_renderer.BindTexture(this.m_debugRenderSystemFont.GetTexture());
            g_renderer.DrawVertexArray(textVerts);
        }
        g_renderer.EndCamera(screenCamera);
    }

    SetVisible(visible)
    {
        this.m_visible = visible;
    }

    ToggleVisible = () =>
    {
        this.m_visible = !this.m_visible;
    }

    Clear = () =>
    {
        this.m_worldGeometry = [];
        this.m_screenGeometry = [];
        this.m_messages = [];
    }

    AddMessage(text, duration, startColor = Rgba8.WHITE, endColor = Rgba8.WHITE)
    {
        let durationTimer = null;
        if (duration !== -1.0)
        {
            durationTimer = new Stopwatch(duration);
            durationTimer.Start();
        }
        const message = new DebugMessage(text, durationTimer, startColor, endColor);
        this.m_messages.push(message);
    }

    AddScreenText(text, position, size, alignment, duration, startColor, endColor)
    {
        if (!this.m_debugRenderSystemFont)
        {
            return;
        }

        const screenText = new DebugGeometry(DebugGeometryType.SCREEN_TEXT);
        this.m_debugRenderSystemFont.AddVertsForTextInBox2D(screenText.m_vertexes, new AABB2(position, position), size, text, startColor, 0.7, alignment, TextBoxMode.OVERRUN);
        if (duration !== -1.0)
        {
            screenText.m_durationTimer = new Stopwatch(duration);
            screenText.m_durationTimer.Start();
        }
        screenText.m_startColor = startColor;
        screenText.m_endColor = endColor;
        screenText.m_texture = this.m_debugRenderSystemFont.GetTexture();
        this.m_screenGeometry.push(screenText);
    }
}

