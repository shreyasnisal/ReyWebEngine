"use strict";

import Vec2 from "/Engine/Math/Vec2.js";


export default class TouchState
{
    constructor()
    {
        this.m_isTouched = true;
        this.m_wasTouchedLastFrame = false;
        this.m_position = new Vec2();
    }
}

