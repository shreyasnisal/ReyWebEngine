"use strict";

import {g_debugRenderSystem} from "/Engine/Core/EngineCommon.js";

import * as GameCommon from "/PortfolioGame/Framework/GameCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";

import EulerAngles from "/Engine/Math/EulerAngles.js";
import Mat44 from "/Engine/Math/Mat44.js";
import Vec3 from "/Engine/Math/Vec3.js";


export default class PlayerPawn
{
    static DRAG = 9.0;
    static MOVE_SPEED = 4.0;
    static EYE_HEIGHT = 1.2;
    static RADIUS = 0.2;

    constructor(owner, position, orientation)
    {
        this.m_owner = owner;
        this.m_position = position;
        this.m_orientation = orientation;
        this.m_velocity = new Vec3(0.0, 0.0, 0.0);
        this.m_acceleration = new Vec3(0.0, 0.0, 0.0);

        this.m_isGrounded = false;
    }

    Update()
    {
        const deltaSeconds = this.m_owner.m_game.m_clock.GetDeltaSeconds();

        this.AddForce(this.m_velocity.GetScaled(-PlayerPawn.DRAG));
        this.AddForce(Vec3.GROUNDWARD.GetScaled(GameCommon.GRAVITY));

        this.m_velocity.Add(this.m_acceleration.GetScaled(deltaSeconds));
        this.m_position.Add(this.m_velocity.GetScaled(deltaSeconds));
        this.m_acceleration = new Vec3(0.0, 0.0, 0.0);

        if (this.m_position.z <= 0.0)
        {
            this.m_position.z = 0.0;
            this.m_velocity.z = 0.0;
            this.m_isGrounded = true;
        }
    }

    MoveInDirection(direction, speed)
    {
        this.AddForce(direction.GetScaled(speed * PlayerPawn.DRAG));
    }

    AddForce(force)
    {
        this.m_acceleration.Add(force);
    }

    AddImpulse(impulse)
    {
        this.m_velocity.Add(impulse);
    }

    GetModelMatrix()
    {
        const modelMatrix = Mat44.CreateTranslation3D(this.m_position);
        modelMatrix.Append(this.m_orientation.GetAsMatrix_iFwd_jLeft_kUp());
        return modelMatrix;
    }

    GetEyePosition()
    {
        return this.m_position.GetSum(new Vec3(0.0, 0.0, PlayerPawn.EYE_HEIGHT));
    }

    GetOrientation()
    {
        return new EulerAngles(this.m_orientation.m_yawDegrees, this.m_orientation.m_pitchDegrees, this.m_orientation.m_rollDegrees);
    }
}
