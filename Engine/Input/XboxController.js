"use strict";

import KeyButtonState from "/Engine/Input/KeyButtonState.js";
import AnalogJoystick from "/Engine/Input/AnalogJoystick.js";


export class XboxButtonID
{
    static XBOX_BUTTON_INVALID = -1;

    static A = 0;
    static B = 1;
    static X = 2;
    static Y = 3;
    static LEFT_SHOULDER = 4;
    static RIGHT_SHOULDER = 5;
    static LEFT_TRIGGER = 6;
    static RIGHT_TRIGGER = 7;
    static BACK = 8;
    static START = 9;
    static LEFT_THUMB = 10;
    static RIGHT_THUMB = 11;
    static DPAD_UP = 12;
    static DPAD_LEFT = 13;
    static DPAD_RIGHT = 14;
    static DPAD_DOWN = 15;

    static NUM = 16;
}

export default class XboxController
{
    constructor(index = -1)
    {
        this.m_index = index;
        this.m_buttons = [];
        for (let buttonIndex = 0; buttonIndex < XboxButtonID.NUM; buttonIndex++)
        {
            this.m_buttons.push(new KeyButtonState());
        }

        this.m_leftJoystick = new AnalogJoystick();
        this.m_rightJoystick = new AnalogJoystick();

        this.m_leftTrigger = 0.0;
        this.m_rightTrigger = 0.0;
    }

    Reset()
    {
        for (let buttonIndex = 0; buttonIndex < XboxButtonID.NUM; buttonIndex++)
        {
            this.m_buttons[buttonIndex].m_isPressed = false;
            this.m_buttons[buttonIndex].m_wasPressedLastFrame = false;
        }
        this.m_leftJoystick.Reset();
        this.m_rightJoystick.Reset();
        this.m_leftTrigger = 0.0;
        this.m_rightTrigger = 0.0;
    }

    Update()
    {
        const gamepad = navigator.getGamepads()[this.m_index];

        if (gamepad.connected)
        {
            for (let buttonIndex = 0; buttonIndex < XboxButtonID.NUM; buttonIndex++)
            {
                this.UpdateButton(buttonIndex, gamepad.buttons[buttonIndex].pressed);
            }
            //Update triggers
            this.m_leftTrigger = gamepad.buttons[XboxButtonID.LEFT_TRIGGER].value;
            this.m_rightTrigger = gamepad.buttons[XboxButtonID.RIGHT_TRIGGER].value;
            //Update Joysticks
            this.m_leftJoystick.UpdatePosition(gamepad.axes[0], -gamepad.axes[1]);
            this.m_rightJoystick.UpdatePosition(gamepad.axes[2], -gamepad.axes[3]);
        }
        else
        {
            this.Reset();
        }
    }

    UpdateButton(buttonID, buttonState)
    {
        this.m_buttons[buttonID].m_wasPressedLastFrame = this.m_buttons[buttonID].m_isPressed;
        this.m_buttons[buttonID].m_isPressed = buttonState;
    }

    IsButtonDown(buttonID)
    {
        return this.m_buttons[buttonID].m_isPressed;
    }

    WasButtonJustPressed(buttonID)
    {
        return this.m_buttons[buttonID].m_isPressed && !this.m_buttons[buttonID].m_wasPressedLastFrame;
    }

    WasButtonJustReleased(buttonID)
    {
        return !this.m_buttons[buttonID].m_isPressed && this.m_buttons[buttonID].m_wasPressedLastFrame;
    }

    GetLeftTrigger()
    {
        return this.m_leftTrigger;
    }

    GetRightTrigger()
    {
        return this.m_rightTrigger;
    }

    GetLeftStick()
    {
        return this.m_leftJoystick;
    }

    GetRightStick()
    {
        return this.m_rightJoystick;
    }
}
