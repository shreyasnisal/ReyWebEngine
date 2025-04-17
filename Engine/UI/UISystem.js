"use strict";

import {g_eventSystem, g_renderer} from "/Engine/Core/EngineCommon.js";

import Vec2 from "/Engine/Math/Vec2.js";

import UIWidget from "/Engine/UI/UIWidget.js";
import {g_aspect} from "/Engine/Renderer/Renderer.js";


export class UISystemConfig
{
    constructor(camera, supportKeyboard, fontFileNameWithNoExtension)
    {
        this.m_camera = camera;
        this.m_supportKeyboard = supportKeyboard;
        this.m_fontFileNameWithNoExtension = fontFileNameWithNoExtension;
    }
}

export default class UISystem
{
    constructor(config)
    {
        this.m_config = config;
        this.m_font = null;
        this.m_lastHoveredWidget = null;
        this.m_selectedInputFieldWidget = null;
        this.m_rootWidget = null;
    }

    Startup()
    {
        g_renderer.CreateOrGetBitmapFont(this.m_config.m_fontFileNameWithNoExtension).then(font =>
        {
            this.m_font = font;
        });

        this.m_rootWidget = new UIWidget(this);
        this.m_rootWidget.SetPosition(this.m_config.m_camera.GetOrthoBottomLeft())
            .SetDimensions(this.m_config.m_camera.GetOrthoTopRight().GetDifference(this.m_config.m_camera.GetOrthoBottomLeft()))
            .SetRaycastTarget(false);

        g_eventSystem.SubscribeEventCallbackFunction("WM_CHAR", this.Event_HandleCharacterPressed);
        g_eventSystem.SubscribeEventCallbackFunction("WM_KEYDOWN", this.Event_HandleKeyPressed);
    }

    BeginFrame()
    {
        if (!this.m_config.m_supportKeyboard)
        {
            this.m_lastHoveredWidget = null;
        }

        this.m_config.m_camera.SetOrthoView(Vec2.ZERO, new Vec2(g_aspect, 1.0));
        this.m_rootWidget.SetDimensions(this.m_config.m_camera.m_orthoView.GetDimensions());
        this.m_rootWidget.Update();
    }

    EndFrame()
    {

    }

    Shutdown()
    {

    }

    Render()
    {
        if (this.m_font == null)
        {
            return;
        }

        g_renderer.BeginCamera(this.m_config.m_camera);
        this.m_rootWidget.Render();
        g_renderer.EndCamera(this.m_config.m_camera);
    }

    CreateWidget(parent = null)
    {
        const newWidget = new UIWidget(this);
        if (parent != null)
        {
            parent.AddChild(newWidget);
        }
        else
        {
            this.m_rootWidget.AddChild(newWidget);
        }
        return newWidget;
    }

    GetLastHoveredWidget()
    {
        return this.m_lastHoveredWidget;
    }

    SetLastHoveredWidget(lastHoveredWidget)
    {
        this.m_lastHoveredWidget = lastHoveredWidget;
        this.SetSelectedInputField(null);
    }

    SetSelectedInputField(selectedInputFieldWidget)
    {
        this.m_selectedInputFieldWidget = selectedInputFieldWidget;
    }

    GetPreviousWidget()
    {
        if (this.m_lastHoveredWidget == null)
        {
            return this.m_rootWidget.m_children[this.m_rootWidget.m_children.length - 1];
        }
        if (this.m_lastHoveredWidget === this.m_rootWidget.m_children[0])
        {
            return this.m_rootWidget.m_children[this.m_rootWidget.m_children.length - 1];
        }

        for (let widgetIndex = 0; widgetIndex < this.m_rootWidget.m_children.length; widgetIndex++)
        {
            if (this.m_rootWidget.m_children[widgetIndex] === this.m_lastHoveredWidget)
            {
                return this.m_rootWidget.m_children[widgetIndex - 1];
            }
        }

        return null;
    }

    GetNextWidget()
    {
        if (this.m_lastHoveredWidget == null)
        {
            return this.m_rootWidget.m_children[0];
        }

        if (this.m_lastHoveredWidget === this.m_rootWidget.m_children[this.m_rootWidget.m_children.length - 1])
        {
            return this.m_rootWidget.m_children[0];
        }

        for (let widgetIndex = 0; widgetIndex < this.m_rootWidget.m_children.length; widgetIndex++)
        {
            if (this.m_rootWidget.m_children[widgetIndex] === this.m_lastHoveredWidget)
            {
                return this.m_rootWidget.m_children[widgetIndex + 1];
            }
        }

        return null;
    }

    SetFocus(focus)
    {
        this.m_rootWidget.SetFocus(focus);
    }

    GetWidgetAtNormalizedCoords(normalizedCoords)
    {
        const rootWidgetModelMatrix = this.m_rootWidget.GetModelMatrix();
        const viewSpaceCoords = rootWidgetModelMatrix.TransformPosition2D(normalizedCoords);

        for (let widgetIndex = 0; widgetIndex < this.m_rootWidget.m_children.length; widgetIndex++)
        {
            const widget = this.m_rootWidget.m_children[widgetIndex];

            const impactWidget = widget.GetWidgetAtViewSpaceCoords(viewSpaceCoords);
            if (impactWidget != null)
            {
                return impactWidget;
            }
        }

        return null;
    }

    Clear()
    {
        // #ToDo Write this
    }

    Event_HandleCharacterPressed()
    {
        // #ToDo Write this
    }

    Event_HandleKeyPressed()
    {
        // #ToDo Write this
    }
}
