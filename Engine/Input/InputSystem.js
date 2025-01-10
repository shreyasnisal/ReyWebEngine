"use strict";

import KeyButtonState from "/Engine/Input/KeyButtonState.js";
import Vec2 from "/Engine/Math/Vec2.js";
import XboxController from "/Engine/Input/XboxController.js";
import InputMapping from "/Engine/Input/InputMapping.js";


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
    constructor(windowManager)
    {
        this.m_windowManager = windowManager;
    }
}

export default class InputSystem
{
    constructor(config)
    {
        this.m_config = config;

        // Initialize variables
        this.m_gamepads = [];
    }

    Startup()
    {
        this.m_keys = [];
        for (let [keyCode, keyIdentifier] of Object.entries(InputMapping))
        {
            this.m_keys[keyIdentifier] = new KeyButtonState();
        }

        this.m_lmb = new KeyButtonState();
        this.m_rmb = new KeyButtonState();

        this.m_cursorState = new CursorState();
        this.m_canvas = document.getElementById("id_canvas");

        this.m_touches = new Map();

        window.addEventListener("keydown", (keyEvent) => this.HandleKeyDown(keyEvent));
        window.addEventListener("keyup", (keyEvent) => this.HandleKeyUp(keyEvent));
        window.addEventListener("mousemove", (mouseEvent) => this.HandleMouseMove(mouseEvent));
        window.addEventListener("mousedown", (mouseEvent) => this.HandleMouseButtonDown(mouseEvent));
        window.addEventListener("mouseup", (mouseEvent) => this.HandleMouseButtonUp(mouseEvent));
        window.addEventListener("gamepadconnected", (gamepadEvent) => this.HandleGamepadConnected(gamepadEvent.gamepad.index));
        window.addEventListener("gamepaddisconnected", (gamepadEvent) => this.HandleGamepadDisconnected(gamepadEvent.gamepad.index));
        window.addEventListener("touchstart", (touchEvent) => { this.HandleTouchStart(touchEvent); });
        window.addEventListener("touchend", (touchEvent) => { this.HandleTouchEnd(touchEvent); })
        window.addEventListener("touchmove", (touchEvent) => { this.HandleTouchMove(touchEvent) });

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
        for (let [keyCode, keyIdentifier] of Object.entries(InputMapping))
        {
            this.m_keys[keyIdentifier].m_wasPressedLastFrame = this.m_keys[keyIdentifier].m_isPressed;
        }

        this.m_cursorState.m_cursorClientDelta = Vec2.ZERO;

        for (const [touchIdentifier, touchState] of this.m_touches)
        {
            touchState.m_wasTouchedLastFrame = touchState.m_isTouched;

            if (!touchState.m_isTouched && !touchState.m_wasPressedLastFrame)
            {
                this.m_touches.delete(touchIdentifier);
            }
        }
    }

    Shutdown()
    {

    }

    HandleKeyDown(keyEvent)
    {
        const keyCode = keyEvent.code;

        if (this.m_keys[keyCode] == null)
        {
            return;
        }

        this.m_keys[keyCode].m_isPressed = true;
        keyEvent.stopImmediatePropagation();
    }

    HandleKeyUp(keyEvent)
    {
        const keyCode = keyEvent.code;

        if (this.m_keys[keyCode] == null)
        {
            return;
        }

        this.m_keys[keyCode].m_isPressed = false;
        keyEvent.stopImmediatePropagation();
    }

    HandleMouseMove(mouseEvent)
    {
        const mousePosition = new Vec2(mouseEvent.clientX, mouseEvent.clientY);
        const mouseMovement = new Vec2(mouseEvent.movementX, mouseEvent.movementY)

        this.m_cursorState.m_cursorClientPosition = new Vec2(mousePosition.x, mousePosition.y);
        if (this.m_cursorState.m_relativeMode)
        {
            this.m_cursorState.m_cursorClientDelta = new Vec2(-mouseMovement.x, -mouseMovement.y);
        }

        mouseEvent.stopImmediatePropagation();
    }

    HandleMouseButtonDown(mouseEvent)
    {
        const mouseButton = mouseEvent.button;

        if (mouseButton === 0)
        {
            this.m_lmb.m_isPressed = true;
        }
        else if (mouseButton === 1)
        {
            // Mouse wheel button pressed
        }
        else if (mouseButton === 2)
        {
            this.m_rmb.m_isPressed = true;
        }

        mouseEvent.stopImmediatePropagation();
    }

    HandleMouseButtonUp(mouseEvent)
    {
        const mouseButton = mouseEvent.button;

        if (mouseButton === 0)
        {
            this.m_lmb.m_isPressed = false;
        }
        else if (mouseButton === 1)
        {
            // Mouse wheel button pressed
        }
        else if (mouseButton === 2)
        {
            this.m_rmb.m_isPressed = false;
        }
        mouseEvent.stopImmediatePropagation();
    }

    IsKeyDown(keyCode)
    {
        if (InputMapping[keyCode] == null)
        {
            return false;
        }

        return this.m_keys[InputMapping[keyCode]].m_isPressed;
    }

    WasKeyJustPressed(keyCode)
    {
        if (InputMapping[keyCode] == null)
        {
            return false;
        }

        return this.m_keys[InputMapping[keyCode]].m_isPressed && !this.m_keys[InputMapping[keyCode]].m_wasPressedLastFrame;
    }

    WasKeyJustReleased(keyCode)
    {
        if (InputMapping[keyCode] == null)
        {
            return false;
        }

        return !this.m_keys[InputMapping[keyCode]].m_isPressed && this.m_keys[InputMapping[keyCode]].m_wasPressedLastFrame;
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

    HandlePointerLockError()
    {
        this.m_canvas.requestPointerLock();
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

    HandleGamepadConnected(gamepadIndex)
    {
        this.m_gamepads.push(new XboxController(gamepadIndex));
    }

    HandleGamepadDisconnected(gamepadIndex)
    {
        for (let gamepadIndex = 0; gamepadIndex < this.m_gamepads.length; gamepadIndex++)
        {
            if (this.m_gamepads[gamepadIndex].m_index === gamepadIndex)
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

    IsTouchSupported()
    {
        return navigator.maxTouchPoints > 0;
    }

    GetMaxSupportedTouchPoints()
    {
        return navigator.maxTouchPoints;
    }

    HandleTouchStart(touchEvent)
    {
        for (const touch of touchEvent.changedTouches)
        {
            // Check if the map already includes a touch with this touch identifier
            if (!this.m_touches.has(touch.identifier))
            {
                const touchState = new TouchState();
                touchState.m_position = new Vec2(touch.clientX, touch.clientY);
                this.m_touches.set(touch.identifier, touchState);
            }
        }
    }

    HandleTouchMove(touchEvent)
    {
        for (const touch of touchEvent.changedTouches)
        {
            const touchState = this.m_touches.get(touch.identifier);
            if (touchState)
            {
                touchState.m_position = new Vec2(touch.clientX, touch.clientY);
            }
        }
    }

    HandleTouchEnd(touchEvent)
    {
        for (const touch of touchEvent.changedTouches)
        {
            const touchState = this.m_touches.get(touch.identifier);
            if (touchState)
            {
                touchState.m_isTouched = false;
            }
        }
    }

    GetActiveTouches()
    {
        return Array.from(this.m_touches.values());
    }
}
