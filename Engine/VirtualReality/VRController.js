"use strict";

import AnalogJoystick from "/Engine/Input/AnalogJoystick.js";
import VRKeyButtonState from "/Engine/VirtualReality/VRKeyButtonState.js";


class VRButtonID
{
    static GRIP = 0;
    static TRIGGER = 1;
    static SELECT = 4;
    static BACK = 5;
}

export default class VRController
{
    constructor(hand, inputSource)
    {
        this.m_hand = hand;
        this.m_inputSource = inputSource;
        this.m_joystick = new AnalogJoystick();

        this.m_selectButton = new VRKeyButtonState();
        this.m_backButton = new VRKeyButtonState();
        this.m_trigger = 0.0;
        this.m_grip = 0.0;
    }

    Update(frame)
    {
        this.m_joystick.UpdatePosition(this.m_inputSource.gamepad.axes[2], -this.m_inputSource.gamepad.axes[3]);

        // Update SELECT Button
        this.m_selectButton.m_wasPressedLastFrame = this.m_selectButton.m_isPressed;
        this.m_selectButton.m_isPressed = this.m_inputSource.gamepad.buttons[VRButtonID.SELECT].pressed;
        this.m_selectButton.m_wasTouchedLastFrame = this.m_selectButton.m_isTouched;
        this.m_selectButton.m_isTouched = this.m_inputSource.gamepad.buttons[VRButtonID.SELECT].touched;

        // Update BACK Button
        this.m_backButton.m_wasPressedLastFrame = this.m_backButton.m_isPressed;
        this.m_backButton.m_isPressed = this.m_inputSource.gamepad.buttons[VRButtonID.BACK].pressed;
        this.m_backButton.m_wasTouchedLastFrame = this.m_backButton.m_isTouched;
        this.m_backButton.m_isTouched = this.m_inputSource.gamepad.buttons[VRButtonID.BACK].touched;

        this.m_grip = this.m_inputSource.gamepad.buttons[VRButtonID.GRIP].value;
        this.m_trigger = this.m_inputSource.gamepad.buttons[VRButtonID.TRIGGER].value;
    }

    GetJoystick()
    {
        return this.m_joystick;
    }

    GetTrigger()
    {
        return this.m_trigger;
    }

    GetGrip()
    {
        return this.m_grip;
    }

    IsSelectButtonDown()
    {
        return this.m_selectButton.m_isPressed;
    }

    WasSelectButtonJustPressed()
    {
        return this.m_selectButton.m_isPressed && !this.m_selectButton.m_wasPressedLastFrame;
    }

    WasSelectButtonJustReleased()
    {
        return !this.m_selectButton.m_isPressed && this.m_selectButton.m_wasPressedLastFrame;
    }

    IsSelectTouched()
    {
        return this.m_selectButton.m_isTouched;
    }

    WasSelectJustTouched()
    {
        return this.m_selectButton.m_isTouched && !this.m_selectButton.m_wasTouchedLastFrame;
    }

    WasSelectJustUntouched()
    {
        return !this.m_selectButton.m_isTouched && this.m_selectButton.m_wasTouchedLastFrame;
    }
}
