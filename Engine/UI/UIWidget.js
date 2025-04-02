"use strict";

import {g_input, g_console, g_eventSystem, g_renderer} from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Mat44 from "/Engine/Math/Mat44.js"
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";


export default class UIWidget
{
    constructor(uiSystem)
    {
        this.m_uiSystem = uiSystem;

        this.m_children = [];
        this.m_parent = null;

        this.m_visible = true;
        this.m_hasFocus = true;
        this.m_consumedClickStart = false;

        this.m_backgroundTexture = null;
        this.m_backgroundColor = Rgba8.TRANSPARENT_BLACK;
        this.m_hoverBackgroundColor = Rgba8.TRANSPARENT_BLACK;

        this.m_color = Rgba8.TRANSPARENT_BLACK;
        this.m_hoverColor = Rgba8.TRANSPARENT_BLACK;
        this.m_text = "";
        this.m_previousText = "";
        this.m_fontSize = 0.0;
        this.m_fontSizeMultiplier = 1.0;
        this.m_image = null;

        this.m_position = new Vec2();
        this.m_dimensions = new Vec2();
        this.m_pivot = new Vec2();
        this.m_alignment = new Vec2();
        this.m_renderBounds = new AABB2();
        this.m_orientationZ = 0.0;

        this.m_borderWidth = 0.0;
        this.m_borderColor = Rgba8.TRANSPARENT_BLACK;
        this.m_hoverBorderColor = Rgba8.TRANSPARENT_BLACK;
        this.m_borderRadius = 0.0;

        this.m_isHovered = false;
        this.m_isVRHovered = false;
        this.m_isRaycastTarget = false;
        this.m_isClicked = false;
        this.m_isVRClicked = false;
        this.m_scrollValue = 0.0;
        this.m_isScrollable = false;
        this.m_scrollBuffer = 0.0;

        this.m_clickEventName = "";
        this.m_isCaretVisible = false;
        this.m_isTextInputField = false;
        this.m_textInputFieldInfoText = "";
        this.m_blinkingCaretTimer = new Stopwatch(0.5, Clock.SystemClock);

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
                this.m_isCaretVisible = !this.m_isCaretVisible;
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
                this.m_renderBounds = bounds.GetBoxAtUVs(new Vec2(0.01, 0.01), new Vec2(0.99, 0.99));
                this.m_renderBounds.m_mins.Add(new Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_renderBounds.m_maxs.Subtract(new Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_fontSizeMultiplier = 0.98;
                this.m_isClicked = true;
            }
            else if (this.m_clickEventName !== "" && this.m_fontSizeMultiplier !== 1.0 && g_input.WasLMBJustReleased())
            {
                this.m_isClicked = false;
                this.m_renderBounds = bounds;
                this.m_renderBounds.m_mins.Add(new Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_renderBounds.m_maxs.Subtract(new Vec2(this.m_borderRadius, this.m_borderRadius));
                this.m_fontSizeMultiplier = 1.0;
                g_console.Execute(this.m_clickEventName);
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
            this.m_renderBounds.m_maxs.Subtract(new Vec2(this.m_borderRadius, this.m_borderRadius));
        }

        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            this.m_children[childIndex].Update();
        }

        this.m_isVRHovered = false;
        this.m_isVRClicked = false;
    }

    Render()
    {
        if (!this.m_visible)
        {
            return;
        }
        if (this.m_parent != null && !MathUtils.DoAABB2Overlap(this.GetViewSpaceBounds(), this.m_parent.GetViewSpaceBounds()))
        {
            return;
        }

        const camera = this.m_uiSystem.m_config.m_camera;
        const bounds = this.GetViewSpaceBounds();

        let backgroundColor = this.m_backgroundColor;
        let color = this.m_color;
        let borderColor = this.m_borderColor;

        const cursorNormalizedPosition = g_input.GetCursorNormalizedPosition();
        const cursorViewPositionX = MathUtils.RangeMap(cursorNormalizedPosition.x, 0.0, 1.0, camera.GetOrthoBottomLeft().x, camera.GetOrthoTopRight().x);
        const cursorViewPositionY = MathUtils.RangeMap(cursorNormalizedPosition.y, 0.0, 1.0, camera.GetOrthoBottomLeft().y, camera.GetOrthoTopRight().y);
        const cursorViewPosition = new Vec2(cursorViewPositionX, cursorViewPositionY);

        if (this.m_hasFocus && bounds.IsPointInside(cursorViewPosition))
        {
            backgroundColor = this.m_hoverBackgroundColor;
            color = this.m_hoverColor.a !== 0 ? this.m_hoverColor : this.m_color;
            borderColor = this.m_hoverBorderColor;
        }

        if (this.m_uiSystem.m_config.m_supportKeyboard && this.m_uiSystem.GetLastHoveredWidget() === this)
        {
            backgroundColor = this.m_hoverBackgroundColor;
            color = this.m_hoverColor.a !== 0 ? this.m_hoverColor : this.m_color;
            borderColor = this.m_hoverBorderColor;
        }

        if (this.m_isVRHovered)
        {
            backgroundColor = this.m_hoverBackgroundColor;
            color = this.m_hoverColor.a !== 0 ? this.m_hoverColor : this.m_color;
            borderColor = this.m_hoverBorderColor;
        }

        g_renderer.SetModelConstants();

        const vertexes = [];
        VertexUtils.AddPCUVertsForAABB2(vertexes, this.m_renderBounds, backgroundColor);
        VertexUtils.AddPCUVertsForAABB2(vertexes, new AABB2(this.m_renderBounds.m_mins.GetSum(Vec2.SOUTH.GetScaled(this.m_borderRadius)), this.m_renderBounds.m_mins.GetSum(Vec2.EAST.GetScaled(this.m_renderBounds.GetDimensions().x))), backgroundColor);
        VertexUtils.AddPCUVertsForAABB2(vertexes, new AABB2(this.m_renderBounds.m_mins.GetSum(Vec2.WEST.GetScaled(this.m_borderRadius)), this.m_renderBounds.m_mins.GetSum(Vec2.NORTH.GetScaled(this.m_renderBounds.GetDimensions().y))), backgroundColor);
        VertexUtils.AddPCUVertsForAABB2(vertexes, new AABB2(this.m_renderBounds.m_mins.GetSum(Vec2.NORTH.GetScaled(this.m_renderBounds.GetDimensions().y)), this.m_renderBounds.m_maxs.GetSum(Vec2.NORTH.GetScaled(this.m_borderRadius))), backgroundColor);
        VertexUtils.AddPCUVertsForAABB2(vertexes, new AABB2(this.m_renderBounds.m_maxs.GetSum(Vec2.SOUTH.GetScaled(this.m_renderBounds.GetDimensions().y)), this.m_renderBounds.m_maxs.GetSum(Vec2.EAST.GetScaled(this.m_borderRadius))), backgroundColor);
        VertexUtils.AddPCUVertsForOrientedSector2D(vertexes, this.m_renderBounds.m_mins, 225.0, 90.0, this.m_borderRadius, backgroundColor);
        VertexUtils.AddPCUVertsForOrientedSector2D(vertexes, new Vec2(this.m_renderBounds.m_mins.x, this.m_renderBounds.m_maxs.y), 135.0, 90.0, this.m_borderRadius, backgroundColor);
        VertexUtils.AddPCUVertsForOrientedSector2D(vertexes, this.m_renderBounds.m_maxs, 45.0, 90.0, this.m_borderRadius, backgroundColor);
        VertexUtils.AddPCUVertsForOrientedSector2D(vertexes, new Vec2(this.m_renderBounds.m_maxs.x, this.m_renderBounds.m_mins.y), 315.0, 90.0, this.m_borderRadius, backgroundColor);

        VertexUtils.AddPCUVertsForLineSegment2D(vertexes, this.m_renderBounds.m_mins.GetSum(Vec2.WEST.GetSum(this.m_borderRadius)), new Vec2(this.m_renderBounds.m_mins.x - this.m_borderRadius, this.m_renderBounds.m_maxs.y), this.m_borderWidth, borderColor);
        VertexUtils.AddPCUVertsForLineSegment2D(vertexes, new Vec2(this.m_renderBounds.m_mins.x, this.m_renderBounds.m_maxs.y + this.m_borderRadius), this.m_renderBounds.m_maxs.GetSum(Vec2.NORTH.GetScaled(this.m_borderRadius)), this.m_borderWidth, borderColor);
        VertexUtils.AddPCUVertsForLineSegment2D(vertexes, this.m_renderBounds.m_maxs.GetSum(Vec2.EAST.GetScaled(this.m_borderRadius)), new Vec2(this.m_renderBounds.m_maxs.x + this.m_borderRadius, this.m_renderBounds.m_mins.y), this.m_borderWidth, borderColor);
        VertexUtils.AddPCUVertsForLineSegment2D(vertexes, new Vec2(this.m_renderBounds.m_maxs.x, this.m_renderBounds.m_mins.y - this.m_borderRadius), this.m_renderBounds.m_mins.GetSum(Vec2.SOUTH.GetScaled(this.m_borderRadius)), this.m_borderWidth, borderColor);
        VertexUtils.AddPCUVertsForArc2D(vertexes, this.m_renderBounds.m_mins, this.m_borderRadius, this.m_borderWidth * 1.5, 180.0, 270.0, borderColor);
        VertexUtils.AddPCUVertsForArc2D(vertexes, new Vec2(this.m_renderBounds.m_mins.x, this.m_renderBounds.m_maxs.y), this.m_borderRadius, this.m_borderWidth * 1.50, 90.0, 180.0, borderColor);
        VertexUtils.AddPCUVertsForArc2D(vertexes, this.m_renderBounds.m_maxs, this.m_borderRadius, this.m_borderWidth * 1.5, 0.0, 90.0, borderColor);
        VertexUtils.AddPCUVertsForArc2D(vertexes, new Vec2(this.m_renderBounds.m_maxs.x, this.m_renderBounds.m_mins.y), this.m_borderRadius, this.m_borderWidth * 1.5, 270.0, 360.0, borderColor);

        g_renderer.BindTexture(this.m_backgroundTexture);
        g_renderer.DrawVertexArray(vertexes);

        if (this.m_isTextInputField)
        {
            if (this.m_text === "")
            {
                const textInfoVertexes = [];
                this.m_uiSystem.m_font.AddVertsForTextInBox2D(textInfoVertexes, this.m_renderBounds, this.m_fontSize * this.m_fontSizeMultiplier, this.m_textInputFieldInfoText, color, 0.5, this.m_alignment);
                g_renderer.BindTexture(this.m_uiSystem.m_font.GetTexture());
                g_renderer.DrawVertexArray(textInfoVertexes);
            }
            else
            {
                const textVertexes = [];
                this.m_uiSystem.m_font.AddVertsForTextInBox2D(textVertexes, this.m_renderBounds, this.m_fontSize * this.m_fontSizeMultiplier, this.m_text, color, 0.5, this.m_alignment);
                g_renderer.BindTexture(this.m_uiSystem.m_font.GetTexture());
                g_renderer.DrawVertexArray(textVertexes);
            }
            if (this.m_uiSystem.m_selectedInputFieldWidget === this)
            {
                if (this.m_isCaretVisible)
                {
                    const caretVerts = [];
                    let caretPositionText = "";
                    for (let commandCharacterIndex = 0; commandCharacterIndex <= this.m_text.length; commandCharacterIndex++)
                    {
                        if (commandCharacterIndex === this.m_caretPosition)
                        {
                            caretPositionText += '_';
                            continue;
                        }
                        caretPositionText += ' ';
                    }
                    this.m_uiSystem.m_font.AddVertsForTextInBox2D(caretVerts, this.m_renderBounds, this.m_fontSize * this.m_fontSizeMultiplier, caretPositionText, color, 0.5, this.m_alignment);
                    g_renderer.BindTexture(this.m_uiSystem.m_font.GetTexture());
                    g_renderer.DrawVertexArray(caretVerts);
                }
            }
        }
        else if (this.m_text !== "")
        {
            const textVertexes = [];
            this.m_uiSystem.m_font.AddVertsForTextInBox2D(textVertexes, this.m_renderBounds, this.m_fontSize * this.m_fontSizeMultiplier, this.m_text, color, 0.5, this.m_alignment);
            g_renderer.BindTexture(this.m_uiSystem.m_font.GetTexture());
            g_renderer.DrawVertexArray(textVertexes);
        }
        else if (this.m_image != null)
        {
            const imageVertexes = [];
            const imageAspect = this.m_image.m_dimensions.x / this.m_image.m_dimensions.y;
            const renderBoundsAspect = this.m_renderBounds.GetDimensions().x / this.m_renderBounds.GetDimensions().y;
            if (imageAspect > renderBoundsAspect)
            {
                // Image aspect is greater than render bounds aspect, reduce render bounds aspect Y
                this.m_renderBounds.SetDimensions(new Vec2(this.m_renderBounds.GetDimensions().x, this.m_renderBounds.GetDimensions().x / imageAspect));
            }
            else if (imageAspect < renderBoundsAspect)
            {
                // Image aspect is less than render bounds aspect, reduce render bounds aspect X
                this.m_renderBounds.SetDimensions(new Vec2(this.m_renderBounds.GetDimensions().y * imageAspect, this.m_renderBounds.GetDimensions().y));
            }
            VertexUtils.AddPCUVertsForAABB2(imageVertexes, this.m_renderBounds, color);
            g_renderer.BindTexture(this.m_image);
            g_renderer.DrawVertexArray(imageVertexes);
        }

        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            this.m_children[childIndex].Render();
        }
    }

    SetText(text)
    {
        this.m_text = text;
        return this;
    }

    SetImage(imagePath)
    {
        g_renderer.CreateOrGetTextureFromFile(imagePath).then(loadedTexture =>
        {
            this.m_image = loadedTexture;
        })

        return this;
    }

    SetPosition(relativePosition)
    {
        this.m_position = relativePosition;
        return this;
    }

    SetDimensions(relativeDimensions)
    {
        this.m_dimensions = relativeDimensions;
        return this;
    }

    SetOrientation(orientationZ)
    {
        this.m_orientationZ = orientationZ;
        return this;
    }

    SetVisible(visible)
    {
        this.m_visible = visible;
        return this;
    }


    SetFocus(focus)
    {
        this.m_hasFocus = focus;
        if (this.m_isTextInputField && this.m_uiSystem.m_selectedInputFieldWidget === this)
        {
            this.m_uiSystem.SetSelectedInputField(null);
        }
        return this;
    }

    SetBackgroundTexture(texturePath)
    {
        g_renderer.CreateOrGetTextureFromFile(texturePath).then(loadedTexture =>
        {
            this.m_backgroundTexture = loadedTexture;
        })

        return this;
    }

    SetBackgroundColor(color)
    {
        this.m_backgroundColor = color;
        return this;
    }

    SetHoverBackgroundColor(color)
    {
        this.m_hoverBackgroundColor = color;
        return this;
    }

    SetColor(color)
    {
        this.m_color = color;
        return this;
    }

    SetHoverColor(color)
    {
        this.m_hoverColor = color;
        return this;
    }

    SetFontSize(fontSize)
    {
        this.m_fontSize = fontSize * this.m_uiSystem.m_rootWidget.m_dimensions.y / 100.0;
        return this;
    }

    SetPivot(pivot)
    {
        this.m_pivot = pivot;
        return this;
    }

    SetAlignment(alignment)
    {
        this.m_alignment = alignment;
        return this;
    }

    SetBorderWidth(borderWidth)
    {
        this.m_borderWidth = borderWidth;
        return this;
    }

    SetBorderColor(color)
    {
        this.m_borderColor = color;
        return this;
    }

    SetHoverBorderColor(color)
    {
        this.m_hoverBorderColor = color;
        return this;
    }

    SetBorderRadius(borderRadius)
    {
        this.m_borderRadius = borderRadius * this.m_uiSystem.m_rootWidget.m_dimensions.y / 100.0;
        return this;
    }

    SetClickEventName(clickEventName)
    {
        this.m_clickEventName = clickEventName;
        return this;
    }

    SetRaycastTarget(isRaycastTarget)
    {
        this.m_isRaycastTarget = isRaycastTarget;
        return this;
    }

    SetScrollable(scrollable)
    {
        this.m_isScrollable = scrollable;
        return this;
    }

    SetScrollValue(scrollValue)
    {
        this.m_scrollValue = scrollValue;
        return this;
    }

    AddScroll(scrollToAdd)
    {
        if (scrollToAdd > 0.0)
        {
            if (this.GetMinYValueInChildren() - this.m_scrollBuffer <= this.GetViewSpaceBounds().m_mins.y)
            {
                this.m_scrollValue += scrollToAdd * (this.m_uiSystem.m_config.m_camera.GetOrthoTopRight().y - this.m_uiSystem.m_config.m_camera.GetOrthoBottomLeft().y) / 100.0;
                if (this.m_scrollValue < 0.0)
                {
                    this.m_scrollValue = 0.0;
                }
            }
        }
        else
        {
            this.m_scrollValue += scrollToAdd * (this.m_uiSystem.m_config.m_camera.GetOrthoTopRight().y - this.m_uiSystem.m_config.m_camera.GetOrthoBottomLeft().y) / 100.0;
            if (this.m_scrollValue < 0.0)
            {
                this.m_scrollValue = 0.0;
            }
        }

        return this;
    }

    SetScrollBuffer(scrollBuffer)
    {
        this.m_scrollBuffer = scrollBuffer;
        return this;
    }

    SetTextInputField(isTextInputField)
    {
        this.m_isTextInputField = isTextInputField;
        return this;
    }

    SetTextInputFieldInfoText(infoText)
    {
        this.m_textInputFieldInfoText = infoText;
        return this;
    }

    GetModelMatrix()
    {
        const modelMatrix = new Mat44();
        if (this.m_parent != null)
        {
            modelMatrix.Append(this.m_parent.GetModelMatrix());
        }
        modelMatrix.AppendTranslation2D(this.m_position);
        modelMatrix.AppendZRotation(this.m_orientationZ);
        modelMatrix.AppendScaleNonUniform2D(this.m_dimensions);

        return modelMatrix;
    }

    GetViewSpaceBounds()
    {
        const localBounds = new AABB2(new Vec2(), new Vec2(1.0, 1.0));
        localBounds.Translate(this.m_pivot.GetScaled(-1.0));

        const modelMatrix = this.GetModelMatrix();

        const viewSpaceBounds = new AABB2();
        const mins = modelMatrix.TransformPosition2D(localBounds.m_mins);
        const maxs = modelMatrix.TransformPosition2D(localBounds.m_maxs);
        viewSpaceBounds.m_mins = new Vec2(mins.x, mins.y);
        viewSpaceBounds.m_maxs = new Vec2(maxs.x, maxs.y);

        viewSpaceBounds.m_mins.y += this.GetScroll();
        viewSpaceBounds.m_maxs.y += this.GetScroll();

        return viewSpaceBounds;
    }

    GetScroll()
    {
        let scrollValue = 0.0;
        let currentWidget = this.m_parent;
        while (currentWidget != null)
        {
            scrollValue += currentWidget.m_scrollValue;
            currentWidget = currentWidget.m_parent;
        }
        return scrollValue;
    }

    GetWidgetAtViewSpaceCoords(viewSpaceCoords)
    {
        if (!this.m_visible)
        {
            return null;
        }
        if (!this.m_hasFocus)
        {
            return null;
        }

        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            const widget = this.m_children[childIndex];
            const resultWidget = widget.GetWidgetAtViewSpaceCoords(viewSpaceCoords);
            if (resultWidget != null)
            {
                return resultWidget;
            }
        }

        if (this.GetViewSpaceBounds().IsPointInside(viewSpaceCoords) && (this.m_isTextInputField || this.m_clickEventName !== "") && this.m_isRaycastTarget)
        {
            return this;
        }
        else
        {
            return null;
        }
    }

    GetMaxYValueInChildren()
    {
        let maxYValue = -Infinity;
        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            const viewSpaceBounds = this.m_children[childIndex].GetViewSpaceBounds();
            if (viewSpaceBounds.m_maxs.y > maxYValue)
            {
                maxYValue = viewSpaceBounds.m_mins.y;
            }
        }
        return maxYValue;
    }

    GetMinYValueInChildren()
    {
        let minYValue = Infinity;
        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            const viewSpaceBounds = this.m_children[childIndex].GetViewSpaceBounds();
            if (viewSpaceBounds.m_mins.y < minYValue)
            {
                minYValue = viewSpaceBounds.m_mins.y;
            }
        }

        return minYValue;
    }

    AddChild(widget)
    {
        this.m_children.push(widget);
        widget.m_parent = this;

        return this;
    }

    RemoveChild(childWidget)
    {
        for (let childIndex = 0; childIndex < this.m_children.length; childIndex++)
        {
            if (this.m_children[childIndex] === childWidget)
            {
                this.m_children.splice(childIndex, 1);
                return;
            }
        }
    }

    HandleCharacterPressed(character)
    {
        // #ToDo Write this
    }

    HandleKeyPressed(keyCode)
    {

    }
}
