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
    static ROLLING_FRICTION = 0.01;
    static SLIDING_FRICTION = 0.2;
    static MAX_ACCELERATION = 25.0;
    static MAX_DECELERATION = 25.0;
    static FRAME_LENGTH = 10.0;
    static MASS = 2.0;
    static FRONT_WHEEL_TURN_RATE = 45.0;
    static MAX_FRONT_WHEEL_ANGULAR_OFFSET = 60.0;

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

        // Front axle calculation
        this.m_frontAxleVelocity.Add(this.m_acceleration.GetScaled(deltaSeconds));
        const frontAxleRollVelocity = MathUtils.GetProjectedOnto2D(this.m_frontAxleVelocity, this.GetFrontWheelNormal());
        const frontAxleSlideVelocity = this.m_frontAxleVelocity.GetDifference(frontAxleRollVelocity);
        frontAxleRollVelocity.Subtract(frontAxleRollVelocity.GetScaled(Car.ROLLING_FRICTION * Car.MASS));
        frontAxleSlideVelocity.Subtract(frontAxleSlideVelocity.GetScaled(Car.SLIDING_FRICTION * Car.MASS));
        this.m_frontAxleVelocity = frontAxleRollVelocity.GetSum(frontAxleSlideVelocity);
        this.m_frontAxlePosition.Add(this.m_frontAxleVelocity.GetScaled(deltaSeconds));

        // Back axle calculation
        this.m_backAxleVelocity.Add(this.m_acceleration.GetScaled(deltaSeconds));
        const backAxleRollVelocity = MathUtils.GetProjectedOnto2D(this.m_backAxleVelocity, this.GetForwardNormal());
        const backAxleSlideVelocity = this.m_backAxleVelocity.GetDifference(backAxleRollVelocity);
        backAxleRollVelocity.Subtract(backAxleRollVelocity.GetScaled(Car.ROLLING_FRICTION * Car.MASS));
        backAxleSlideVelocity.Subtract(backAxleSlideVelocity.GetScaled(Car.SLIDING_FRICTION * Car.MASS));
        this.m_backAxleVelocity = backAxleRollVelocity.GetSum(backAxleSlideVelocity);
        this.m_backAxlePosition.Add(this.m_backAxleVelocity.GetScaled(deltaSeconds));

        // Correction from fixed frame length
        this.PerformFrameCorrectionAndUpdatePosition();

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
        this.m_acceleration.Add(this.GetForwardNormal().GetScaled(gas * Car.MAX_ACCELERATION * Car.MASS));
    }

    AddReverse(reverse)
    {
        this.m_acceleration.Add(this.GetForwardNormal().GetScaled(-reverse * Car.MAX_DECELERATION * Car.MASS));
    }

    TurnWheelsToOrientation(targetOrientation)
    {
        this.m_frontWheelRelativeAngularOffset = MathUtils.GetTurnedTowardDegrees(this.GetOrientationDegrees(), targetOrientation, Car.MAX_FRONT_WHEEL_ANGULAR_OFFSET) - this.GetOrientationDegrees();
    }
}

