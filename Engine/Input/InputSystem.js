"use strict";

import KeyButtonState from "../../Engine/Input/KeyButtonState.js";
import Vec2 from "../../Engine/Math/Vec2.js";

class CursorState
{
    constructor()
    {
        this.m_cursorClientDelta = Vec2.ZERO;
        this.m_cursorClientPosition = Vec2.ZERO;
        this.m_hiddenMode = false;
        this.m_relativeMode = false;
        this.m_wheelScrollDelta = 0;
    }
}

export class InputSystemConfig
{
    constructor()
    {
    }
}

export default class InputSystem
{
    static NUM_KEYS = 256;

    constructor(config)
    {
        this.m_config = config;
    }

    Startup()
    {
        this.m_keys = [];
        for (let keyIndex = 0; keyIndex < InputSystem.NUM_KEYS; keyIndex++)
        {
            this.m_keys[keyIndex] = new KeyButtonState();
        }

        this.m_cursorState = new CursorState();
        this.m_canvas = document.getElementById("id_canvas");

        window.addEventListener("keydown", (keyEvent) => this.HandleKeyDown(keyEvent));
        window.addEventListener("keyup", (keyEvent) => this.HandleKeyUp(keyEvent));
        window.addEventListener("mousemove", (keyEvent) => this.HandleMouseMove(keyEvent));
    }

    BeginFrame()
    {
        if (!this.m_cursorState.m_relativeMode)
        {
            this.m_cursorState.m_cursorClientDelta = Vec2.ZERO;
        }
    }

    EndFrame()
    {
        for (let keyIndex = 0; keyIndex < InputSystem.NUM_KEYS; keyIndex++)
        {
            this.m_keys[keyIndex].m_wasPressedLastFrame = this.m_keys[keyIndex].m_isPressed;
        }

        this.m_cursorState.m_cursorClientDelta = Vec2.ZERO;
    }

    Shutdown()
    {

    }

    HandleKeyDown(keyEvent)
    {
        this.m_keys[keyEvent.which].m_isPressed = true;
    }

    HandleKeyUp(keyEvent)
    {
        this.m_keys[keyEvent.which].m_isPressed = false;
    }

    HandleMouseMove(keyEvent)
    {
        this.m_cursorState.m_cursorClientPosition = new Vec2(keyEvent.clientX, keyEvent.clientY);
        if (this.m_cursorState.m_relativeMode)
        {
            this.m_cursorState.m_cursorClientDelta = new Vec2(keyEvent.movementX, keyEvent.movementY);
        }
    }

    IsKeyDown(keyCode)
    {
        return this.m_keys[keyCode].m_isPressed;
    }

    WasKeyJustPressed(keyCode)
    {
        return this.m_keys[keyCode].m_isPressed && !this.m_keys[keyCode].m_wasPressedLastFrame;
    }

    WasKeyJustReleased(keyCode)
    {
        return !this.m_keys[keyCode].m_isPressed && this.m_keys[keyCode].m_wasPressedLastFrame;
    }

    SetCursorMode(hiddenMode, relativeMode)
    {
        this.m_cursorState.m_hiddenMode = hiddenMode;
        this.m_cursorState.m_relativeMode = relativeMode;

        if (relativeMode)
        {
            this.m_canvas.requestPointerLock();
        }
        else
        {
            document.exitPointerLock();
        }
    }
}
