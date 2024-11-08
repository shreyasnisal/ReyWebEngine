"use strict";

import KeyButtonState from "../../Engine/Input/KeyButtonState.js";
import Vec2 from "../../Engine/Math/Vec2.js";
import XboxController from "../../Engine/Input/XboxController.js";


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

        // Initialize variables
        this.m_gamepads = [];
    }

    Startup()
    {
        this.m_keys = [];
        for (let keyIndex = 0; keyIndex < InputSystem.NUM_KEYS; keyIndex++)
        {
            this.m_keys[keyIndex] = new KeyButtonState();
        }

        this.m_lmb = new KeyButtonState();
        this.m_rmb = new KeyButtonState();

        this.m_cursorState = new CursorState();
        this.m_canvas = document.getElementById("id_canvas");

        window.addEventListener("keydown", (keyEvent) => this.HandleKeyDown(keyEvent));
        window.addEventListener("keyup", (keyEvent) => this.HandleKeyUp(keyEvent));
        window.addEventListener("mousemove", (keyEvent) => this.HandleMouseMove(keyEvent));
        window.addEventListener("mousedown", (keyEvent) => this.HandleMouseButtonDown(keyEvent));
        window.addEventListener("mouseup", (keyEvent) => this.HandleMouseButtonUp(keyEvent));
        window.addEventListener("gamepadconnected", (gamepadEvent) => this.HandleGamepadConnected(gamepadEvent));
        window.addEventListener("gamepaddisconnected", (gamepadEvent) => this.HandleGamepadDisconnected(gamepadEvent));

        document.onpointerlockerror = () => this.HandlePointerLockError();
    }

    BeginFrame()
    {
        if (!this.m_cursorState.m_relativeMode)
        {
            this.m_cursorState.m_cursorClientDelta = Vec2.ZERO;
        }

        // Poll all gamepads for inputs
        for (let gamepadIndex = 0; gamepadIndex < this.m_gamepads.length; gamepadIndex++)
        {
            this.m_gamepads[gamepadIndex].Update();
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
            this.m_cursorState.m_cursorClientDelta = new Vec2(-keyEvent.movementX, -keyEvent.movementY);
        }
    }

    HandleMouseButtonDown(keyEvent)
    {
        if (keyEvent.button === 0)
        {
            this.m_lmb.m_isPressed = true;
        }
        else if (keyEvent.button === 1)
        {
            // Mouse wheel button pressed
        }
        else if (keyEvent.button === 2)
        {
            this.m_rmb.m_isPressed = true;
        }
    }

    HandleMouseButtonUp(keyEvent)
    {
        if (keyEvent.button === 0)
        {
            this.m_lmb.m_isPressed = false;
        }
        else if (keyEvent.button === 1)
        {
            // Mouse wheel button pressed
        }
        else if (keyEvent.button === 2)
        {
            this.m_rmb.m_isPressed = false;
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

    IsLMBDown()
    {
        return this.m_lmb.m_isPressed;
    }

    WasLMBJustPressed()
    {
        return this.m_lmb.m_isPressed && !this.m_lmb.m_wasPressedLastFrame;
    }

    WasLMBJustReleased()
    {
        return !this.m_lmb.m_isPressed && this.m_lmb.m_wasPressedLastFrame;
    }

    IsRMBDown()
    {
        return this.m_rmb.m_isPressed;
    }

    WasRMBJustPressed()
    {
        return this.m_rmb.m_isPressed && !this.m_rmb.m_wasPressedLastFrame;
    }

    WasRMBJustReleased()
    {
        return !this.m_rmb.m_isPressed && this.m_rmb.m_wasPressedLastFrame;
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

    IsCursorRelativeMode()
    {
        return this.m_cursorState.m_relativeMode;
    }

    IsCursorHidden()
    {
        return this.m_cursorState.m_hiddenMode;
    }

    GetCursorClientDelta()
    {
        return this.m_cursorState.m_cursorClientDelta;
    }

    HandlePointerLockError()
    {
        if (this.m_cursorState.m_relativeMode)
        {
            this.m_canvas.requestPointerLock();
        }
    }

    HandleGamepadConnected(gamepadEvent)
    {
        this.m_gamepads.push(new XboxController(gamepadEvent.gamepad.index));
    }

    HandleGamepadDisconnected(gamepadEvent)
    {
        for (let gamepadIndex = 0; gamepadIndex < this.m_gamepads.length; gamepadIndex++)
        {
            if (this.m_gamepads[gamepadIndex] === gamepadEvent.gamepad.index)
            {
                this.m_gamepads[gamepadIndex].Reset();
                this.m_gamepads.splice(gamepadIndex, 1);
            }
        }
    }

    GetController(controllerID)
    {
        if (this.m_gamepads.length > controllerID)
        {
            return this.m_gamepads[controllerID];
        }

        return null;
    }
}
