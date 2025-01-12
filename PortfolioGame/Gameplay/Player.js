"use strict";

import PlayerPawn from "/PortfolioGame/Gameplay/PlayerPawn.js";

import {g_debugRenderSystem, g_input} from "/Engine/Core/EngineCommon.js";
import Rgba8 from "/Engine/Core/Rgba8.js";

import {XboxButtonID} from "/Engine/Input/XboxController.js";

import EulerAngles from "/Engine/Math/EulerAngles.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec3 from "/Engine/Math/Vec3.js";


export default class Player
{
    constructor(game, position, orientation)
    {
        this.m_game = game;
        this.m_position = new Vec3(position.x, position.y, position.z);
        this.m_orientation = new EulerAngles(orientation.m_yawDegrees, orientation.m_pitchDegrees, orientation.m_rollDegrees);
        this.m_isFreeFlyMode = false;
        this.m_controlsEnabled = false;

        this.m_pawn = new PlayerPawn(this, new Vec3(position.x, position.y, position.z), new EulerAngles(orientation.m_yawDegrees, 0.0, 0.0));
    }

    Update()
    {
        this.HandleInput();
        if (!this.m_isFreeFlyMode)
        {
            this.m_pawn.Update();
        }
    }

    HandleInput()
    {
        if (g_input.WasKeyJustPressed("F1"))
        {
            this.m_isFreeFlyMode = !this.m_isFreeFlyMode;
        }

        if (!this.m_controlsEnabled)
        {
            return;
        }

        if (this.m_isFreeFlyMode)
        {
            this.HandleFreeFlyKeyboardInput();
            this.HandleFreeFlyControllerInput();

            this.m_orientation.m_pitchDegrees = MathUtils.GetClamped(this.m_orientation.m_pitchDegrees, -89.0, 89.0);
        }
        else
        {
            this.HandleFirstPersonKeyboardInput();
            this.HandleFirstPersonControllerInput();

            this.m_pawn.m_orientation.m_pitchDegrees = MathUtils.GetClamped(this.m_pawn.m_orientation.m_pitchDegrees, -89.0, 89.0);
        }
    }

    HandleFreeFlyKeyboardInput()
    {
        const deltaSeconds = this.m_game.m_clock.GetDeltaSeconds();

        const MOVEMENT_SPEED = 10.0;

        const playerBasis = this.m_orientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        if (g_input.IsKeyDown('W'))
        {
            this.m_position.Add(playerFwd.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('A'))
        {
            this.m_position.Add(playerLeft.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('S'))
        {
            this.m_position.Add(playerFwd.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('D'))
        {
            this.m_position.Add(playerLeft.GetScaled(-MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('Q'))
        {
            this.m_position.Add(Vec3.GROUNDWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }
        if (g_input.IsKeyDown('E'))
        {
            this.m_position.Add(Vec3.SKYWARD.GetScaled(MOVEMENT_SPEED * deltaSeconds));
        }

        this.m_orientation.m_yawDegrees += g_input.GetCursorClientDelta().x * 0.15;
        this.m_orientation.m_pitchDegrees -= g_input.GetCursorClientDelta().y * 0.15;
    }

    HandleFirstPersonKeyboardInput()
    {
        const deltaSeconds = this.m_game.m_clock.GetDeltaSeconds();

        const movementFwd = this.m_pawn.GetModelMatrix().GetIBasis3D().GetXY().GetNormalized().GetAsVec3();
        const movementLeft = this.m_pawn.GetModelMatrix().GetJBasis3D().GetXY().GetNormalized().GetAsVec3();

        if (g_input.IsKeyDown('W'))
        {
            this.m_pawn.MoveInDirection(movementFwd, PlayerPawn.MOVE_SPEED);
        }
        if (g_input.IsKeyDown('A'))
        {
            this.m_pawn.MoveInDirection(movementLeft, PlayerPawn.MOVE_SPEED);
        }
        if (g_input.IsKeyDown('S'))
        {
            this.m_pawn.MoveInDirection(movementFwd, -PlayerPawn.MOVE_SPEED);
        }
        if (g_input.IsKeyDown('D'))
        {
            this.m_pawn.MoveInDirection(movementLeft, -PlayerPawn.MOVE_SPEED);
        }

        if (g_input.WasKeyJustPressed("Space"))
        {
            if (this.m_pawn.m_isGrounded)
            {
                this.m_pawn.AddImpulse(new Vec3(0.0, 0.0, 20.0));
                this.m_pawn.m_isGrounded = false;
            }
        }

        this.m_pawn.m_orientation.m_yawDegrees += g_input.GetCursorClientDelta().x * 0.15;
        this.m_pawn.m_orientation.m_pitchDegrees -= g_input.GetCursorClientDelta().y * 0.15;
    }

    HandleFreeFlyControllerInput()
    {
        const deltaSeconds = this.m_game.m_clock.GetDeltaSeconds();

        const controller = g_input.GetController(0);
        if (controller == null)
        {
            return;
        }

        const MOVEMENT_SPEED = 4.0;
        const TURN_RATE = 90.0;

        const playerBasis = this.m_orientation.GetAsVectors_iFwd_jLeft_kUp();
        const playerFwd = playerBasis[0];
        const playerLeft = playerBasis[1];
        const playerUp = playerBasis[2];

        const leftJoystick = controller.GetLeftStick();
        const rightJoystick = controller.GetRightStick();

        let velocityZ = 0.0;
        if (controller.IsButtonDown(XboxButtonID.LEFT_SHOULDER))
        {
            velocityZ -= 1.0;
        }
        if (controller.IsButtonDown(XboxButtonID.RIGHT_SHOULDER))
        {
            velocityZ += 1.0;
        }

        this.m_position.Add(playerFwd.GetScaled(leftJoystick.m_deadzoneCorrectedCartesianCoordinates.y * MOVEMENT_SPEED * deltaSeconds));
        this.m_position.Add(playerLeft.GetScaled(-leftJoystick.m_deadzoneCorrectedCartesianCoordinates.x * MOVEMENT_SPEED * deltaSeconds));
        this.m_position.Add(Vec3.SKYWARD.GetScaled(velocityZ * MOVEMENT_SPEED * deltaSeconds));

        this.m_orientation.m_yawDegrees -= rightJoystick.m_deadzoneCorrectedCartesianCoordinates.x * TURN_RATE * deltaSeconds;
        this.m_orientation.m_pitchDegrees -= rightJoystick.m_deadzoneCorrectedCartesianCoordinates.y * TURN_RATE * deltaSeconds;
    }

    HandleFirstPersonControllerInput()
    {

    }
}
