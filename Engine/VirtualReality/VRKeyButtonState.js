"use strict";

export default class VRKeyButtonState
{
    constructor()
    {
        this.m_isPressed = false;
        this.m_wasPressedLastFrame = false;
        this.m_isTouched = false;
        this.m_wasTouchedLastFrame = false;
    }
}
