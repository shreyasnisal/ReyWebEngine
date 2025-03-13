"use strict";

import { g_input } from "/Engine/Core/EngineCommon.js";

import { FireEvent } from "/Engine/Core/EventSystem.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Rgba8 from "../Core/Rgba8";


export default class UIWidget
{
    constructor(uiSystem)
    {
        this.m_uiSystem = uiSystem;

        this.m_isVisible = true;
        this.m_hasFocus = true;
        this.m_borderWidth = 0.0;
        this.m_borderColor = Rgba8.TRANSPARENT_BLACK;
        this.m_borderRadius = 0.0;
        this.m_isCaretVisible = false;
        this.m_isTextInputField = false;
        this.m_isScrollable = false;
        this.m_clickEventName = "";
    }

    Update()
    {
        if (!this.m_hasFocus)
        {
            const bounds = this.GetViewSpaceBounds();
            this.m_renderBounds = bounds.GetBoxAtUVs(Vec2.ZERO, Vec2.ONE);
            this.m_renderBounds.m_mins.Add(new Vec2(this.m_borderRadius, this.m_borderRadius));
            this.m_renderBounds.m_maxs.Subtract(new Vec2(this.m_borderRadius, this.m_borderRadius));
            return;
        }

        if (this.m_isTextInputField && this.m_uiSystem.m_selectedInputFieldWidget)
        {
            while (this.m_blinkingCaretTimer.DecrementDurationIfElapsed())
            {
                this.m_isCaretVisible = !m_isCaretVisible;
            }
        }

        const camera = this.m_uiSystem.m_config.m_camera;
        const bounds = this.GetViewSpaceBounds();

        const cursorNormalizedPosition = g_input.GetCursorNormalizedPosition();
        const cursorViewPositionX = MathUtils.RangeMap(cursorNormalizedPosition.x, 0.0, 1.0, camera.GetOrthoBottomLeft().x, camera.GetOrthoTopRight().x);
        const cursorViewPositionY = MathUtils.RangeMap(cursorNormalizedPosition.y, 0.0, 1.0, camera.GetOrthoBottomLeft().y, camera.GetOrthoTopRight().y);
        const cursorViewPosition = new Vec2(cursorViewPositionX, cursorViewPositionY);

        if (bounds.IsPointInside(cursorViewPosition))
        {
            if (this.m_isScrollable)
            {
                this.AddScroll(g_input.m_cursorState.m_wheelScrollDelta);
            }

            if (this.m_clickEventName !== "")
            {
                this.m_uiSystem.SetLastHoveredWidget(this);
            }

            if (this.m_isTextInputField && g_input.WasLMBJustPressed())
            {
                this.m_previousText = this.m_text;
                this.m_text = "";
                this.m_caretPosition = 0;
                this.m_uiSystem.SetSelectedInputField(this);
                this.m_blinkingCaretTimer.Start();
            }
            else if (this.m_clickEventName !== "" && g_input.WasLMBJustPressed())
            {
                this.m_consumedClickStart = true;
                this.m_renderBounds = bounds.GetBoxAtUVs(Vec2(0.01, 0.01), Vec2(0.99, 0.99));
                this.m_renderBounds.m_mins.Add(Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_renderBounds.m_maxs.Subtract(Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_fontSizeMultiplier = 0.98;
                this.m_isClicked = true;
            }
            else if (!this.m_clickEventName.empty() && this.m_fontSizeMultiplier != 1.0 && g_input.WasKeyJustReleased("LMB"))
            {
                this.m_isClicked = false;
                this.m_renderBounds = bounds;
                this.m_renderBounds.m_mins.Add(new Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_renderBounds.m_maxs.Subtract(new Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_fontSizeMultiplier = 1.0;
                FireEvent(this.m_clickEventName);
            }
        }
        else
        {
            this.m_fontSizeMultiplier = 1.0;
            this.m_renderBounds = bounds;
            this.m_renderBounds.m_mins.Add(new Vec2(this.m_borderRadius, this.m_borderRadius));
            this.m_renderBounds.m_maxs.Subtract(new Vec2(this.m_borderRadius, this.m_borderRadius));
            this.m_isClicked = false;
        }

        if (!this.m_isClicked && !this.m_isVRClicked)
        {
            this.m_renderBounds = bounds;
            this.m_renderBounds.m_mins.Add(new Vec2(this.m_borderRadius, this.m_borderRadius));
            this.m_renderBounds.m_maxs.Subtract(Vec2(this.m_borderRadius, this.m_borderRadius));
        }

        for (let childIndex = 0; childIndex < this.m_children.size(); childIndex++)
        {
            this.m_children[childIndex].Update();
        }

        this.m_isVRHovered = false;
        this.m_isVRClicked = false;
    }

    Render()
    {

    }
}
