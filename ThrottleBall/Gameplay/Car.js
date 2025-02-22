"use strict";

import { g_renderer } from "/Engine/Core/EngineCommon.js";

import * as VertexUtils from "/Engine/Core/VertexUtils.js";
import Rgba8 from "/Engine/Core/Rgba8.js";

import * as MathUtils from "/Engine/Math/MathUtils.js";
import OBB2 from "/Engine/Math/OBB2.js";
import Vec2 from "/Engine/Math/Vec2.js";

import { BlendMode, CullMode, DepthMode } from "/Engine/Renderer/Renderer.js";


export default class Car
{
    // To change friction, change only the COEFFICIENTS!
    static ROLLING_FRICTION_COEFFICIENT = 0.01;
    static FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT = 0.1;
    static BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT = 0.05;
    static MAX_ACCELERATION = 60.0;
    static MAX_DECELERATION = 60.0;
    static FRAME_LENGTH = 10.0;
    static MASS = 100.0;
    static FRONT_WHEEL_TURN_RATE = 45.0;
    static MAX_FRONT_WHEEL_ANGULAR_OFFSET = 60.0;
    static ELASTICITY = 1.0;

    // Don't change these values
    static ROLLING_FRICTION = Car.ROLLING_FRICTION_COEFFICIENT * 60.0;
    static FRONT_WHEEL_SLIDING_FRICTION = Car.FRONT_WHEEL_SLIDING_FRICTION_COEFFICIENT * 60.0;
    static BACK_WHEEL_SLIDING_FRICTION = Car.BACK_WHEEL_SLIDING_FRICTION_COEFFICIENT * 60.0;

    constructor(map, position, orientation, controller)
    {
        this.m_map = map;

        this.m_position = position;
        const forwardNormal = Vec2.MakeFromPolarDegrees(orientation);

        this.m_frontAxlePosition = position.GetSum(forwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
        this.m_frontAxleVelocity = new Vec2(0.0, 0.0);
        this.m_backAxlePosition = position.GetDifference(forwardNormal.GetScaled(Car.FRAME_LENGTH * 0.5));
        this.m_backAxleVelocity = new Vec2(0.0, 0.0);

        this.m_controller = controller;
        this.m_acceleration = new Vec2(0.0, 0.0);
        this.m_texture = null;

        this.m_frontWheelRelativeAngularOffset = 0.0;
    }

    Update()
    {
        const deltaSeconds = this.m_map.m_game.m_clock.GetDeltaSeconds();

        // Calculate friction scaled to deltaTime
        const rollingFrictionThisFrame = Car.ROLLING_FRICTION * deltaSeconds;
        const frontWheelSlidingFictionThisFrame = Car.FRONT_WHEEL_SLIDING_FRICTION * deltaSeconds;
        const backWheelSlidingFictionThisFrame = Car.BACK_WHEEL_SLIDING_FRICTION * deltaSeconds;

        // Front axle calculation
        //---------------------------------------------------------------------------------
        this.m_frontAxleVelocity.Add(this.m_acceleration.GetScaled(deltaSeconds));
        const frontAxleMomentum = this.m_frontAxleVelocity.GetScaled(Car.MASS * 0.5);

        const frontAxleRollMomentum = MathUtils.GetProjectedOnto2D(frontAxleMomentum, this.GetFrontWheelNormal());
        const frontAxleSlideMomentum = frontAxleMomentum.GetDifference(frontAxleRollMomentum);

        frontAxleRollMomentum.Subtract(frontAxleRollMomentum.GetScaled(rollingFrictionThisFrame));
        frontAxleSlideMomentum.Subtract(frontAxleSlideMomentum.GetScaled(frontWheelSlidingFictionThisFrame));

        const frontAxleMomentumAfterFriction = frontAxleRollMomentum.GetSum(frontAxleSlideMomentum);
        this.m_frontAxleVelocity = frontAxleMomentumAfterFriction.GetScaled(2.0 / Car.MASS);

        if (this.m_frontAxleVelocity.GetLengthSquared() < 0.01)
        {
            this.m_frontAxleVelocity = new Vec2(0.0, 0.0);
        }
        this.m_frontAxlePosition.Add(this.m_frontAxleVelocity.GetScaled(deltaSeconds));
        //---------------------------------------------------------------------------------

        // Back axle calculation
        //---------------------------------------------------------------------------------
        this.m_backAxleVelocity.Add(this.m_acceleration.GetScaled(deltaSeconds));
        const backAxleMomentum = this.m_backAxleVelocity.GetScaled(Car.MASS * 0.5);

        const backAxleRollMomentum = MathUtils.GetProjectedOnto2D(backAxleMomentum, this.GetForwardNormal());
        const backAxleSlideMomentum = backAxleMomentum.GetDifference(backAxleRollMomentum);

        backAxleRollMomentum.Subtract(backAxleRollMomentum.GetScaled(rollingFrictionThisFrame));
        backAxleSlideMomentum.Subtract(backAxleSlideMomentum.GetScaled(backWheelSlidingFictionThisFrame));

        const backAxleMomentumAfterFriction = backAxleRollMomentum.GetSum(backAxleSlideMomentum);
        this.m_backAxleVelocity = backAxleMomentumAfterFriction.GetScaled(2.0 / Car.MASS);

        if (this.m_backAxleVelocity.GetLengthSquared() < 0.01)
        {
            this.m_backAxleVelocity = new Vec2(0.0, 0.0);
        }
        this.m_backAxlePosition.Add(this.m_backAxleVelocity.GetScaled(deltaSeconds));
        //---------------------------------------------------------------------------------

        // Correction from fixed frame length
        this.PerformFrameCorrectionAndUpdatePosition();

        // Reset acceleration: Acceleration is accumulated every frame
        this.m_acceleration = new Vec2(0.0, 0.0);
    }

    PerformFrameCorrectionAndUpdatePosition()
    {
        const dispBackAxleToFrontAxle = this.m_frontAxlePosition.GetDifference(this.m_backAxlePosition);
        const currentFrameLength = dispBackAxleToFrontAxle.GetLength();
        const correctionPerAxle = (currentFrameLength - Car.FRAME_LENGTH) * 0.5;
        const dirBackAxleToFrontAxle = dispBackAxleToFrontAxle.GetNormalized();
        this.m_frontAxlePosition.Subtract(dirBackAxleToFrontAxle.GetScaled(correctionPerAxle));
        this.m_backAxlePosition.Add(dirBackAxleToFrontAxle.GetScaled(correctionPerAxle));

        // Update Position
        this.m_position = this.m_backAxlePosition.GetSum(dirBackAxleToFrontAxle.GetScaled(Car.FRAME_LENGTH * 0.5));
    }

    FixedUpdate(deltaSeconds)
    {
    }

    Render()
    {
        const carVerts = [];
        VertexUtils.AddPCUVertsForOBB2(carVerts, new OBB2(this.m_position, this.GetForwardNormal(), new Vec2(Car.FRAME_LENGTH * 0.5, Car.FRAME_LENGTH * 0.5 * 0.5)));
        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(this.m_texture);
        g_renderer.DrawVertexArray(carVerts);

        if (this.m_map.m_drawDebug)
        {
            this.RenderDebug();
        }
    }

    RenderDebug()
    {
        const debugCarVerts = [];
        VertexUtils.AddPCUVertsForDisc2D(debugCarVerts, this.m_position.GetSum(this.GetForwardNormal().GetScaled(Car.FRAME_LENGTH * 0.5)), 0.5, Rgba8.MAGENTA);
        VertexUtils.AddPCUVertsForDisc2D(debugCarVerts, this.m_position.GetDifference(this.GetForwardNormal().GetScaled(Car.FRAME_LENGTH * 0.5)), 0.5, Rgba8.MAGENTA);
        VertexUtils.AddPCUVertsForArrow2D(debugCarVerts, this.m_position, this.m_frontAxlePosition, 1.0, 0.1, Rgba8.RED);
        VertexUtils.AddPCUVertsForArrow2D(debugCarVerts, this.m_position, this.m_position.GetSum(this.GetLeftNormal().GetScaled(Car.FRAME_LENGTH * 0.5)), 1.0, 0.1, Rgba8.GREEN);
        VertexUtils.AddPCUVertsForArrow2D(debugCarVerts, this.m_frontAxlePosition, this.m_frontAxlePosition.GetSum(this.GetFrontWheelNormal().GetScaled(Car.FRAME_LENGTH * 0.5)), 1.0, 0.1, Rgba8.ORANGE);
        VertexUtils.AddPCUVertsForArrow2D(debugCarVerts, this.m_frontAxlePosition, this.m_frontAxlePosition.GetSum(this.m_frontAxleVelocity), 1.0, 0.1, Rgba8.YELLOW);
        VertexUtils.AddPCUVertsForArrow2D(debugCarVerts, this.m_backAxlePosition, this.m_backAxlePosition.GetSum(this.m_backAxleVelocity), 1.0, 0.1, Rgba8.CYAN);

        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(debugCarVerts);
    }

    GetForwardNormal()
    {
        return (this.m_frontAxlePosition.GetDifference(this.m_backAxlePosition).GetNormalized());
    }

    GetLeftNormal()
    {
        return this.GetForwardNormal().GetRotated90Degrees();
    }

    GetOrientationDegrees()
    {
        return this.GetForwardNormal().GetOrientationDegrees();
    }

    GetFrontWheelNormal()
    {
        return this.GetForwardNormal().GetRotatedDegrees(this.m_frontWheelRelativeAngularOffset);
    }

    GetBounds()
    {
        return new OBB2(this.m_position, this.GetForwardNormal(), new Vec2(Car.FRAME_LENGTH * 0.5, Car.FRAME_LENGTH * 0.5 * 0.5));
    }

    AddGas(gas)
    {
        this.m_acceleration.Add(this.GetForwardNormal().GetScaled(gas * Car.MAX_ACCELERATION));
    }

    AddReverse(reverse)
    {
        this.m_acceleration.Add(this.GetForwardNormal().GetScaled(-reverse * Car.MAX_DECELERATION));
    }

    TurnWheelsToOrientation(targetOrientation)
    {
        this.m_frontWheelRelativeAngularOffset = MathUtils.GetTurnedTowardDegrees(this.GetOrientationDegrees(), targetOrientation, Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET) - this.GetOrientationDegrees();
    }
}

