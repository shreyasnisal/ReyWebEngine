"use strict";

import { g_renderer } from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";

import {BlendMode, CullMode, DepthMode} from "/Engine/Renderer/Renderer.js";


export default class Ball
{
    // To change the friction, change ONLY the COEFFICIENTS!
    static ROLLING_FRICTION_COEFFICIENT = 0.01;
    static RADIUS = 2.0;
    static MASS = 1.0;
    static ELASTICITY = 1.0;

    // Don't change these values
    static ROLLING_FRICTION = Ball.ROLLING_FRICTION_COEFFICIENT * 100.0;

    constructor(map, position)
    {
        this.m_map = map;
        this.m_position = position;

        this.m_velocity = new Vec2(0.0, 0.0);
        this.m_acceleration = new Vec2(0.0, 0.0);
    }

    Update()
    {
        const deltaSeconds = this.m_map.m_game.m_clock.GetDeltaSeconds();

        this.m_velocity.Add(this.m_acceleration.GetScaled(deltaSeconds));

        const momentum = this.m_velocity.GetScaled(Ball.MASS);
        const rollingFrictionThisFrame = Ball.ROLLING_FRICTION * deltaSeconds;
        const momentumAfterFriction = momentum.GetDifference(momentum.GetScaled(rollingFrictionThisFrame)); // This should not be the same as AddForce
        this.m_velocity = momentumAfterFriction.GetScaled(1.0 / Ball.MASS);

        // Stop moving if the velocity is super low
        if (this.m_velocity.GetLengthSquared() < 0.01)
        {
            this.m_velocity = new Vec2(0.0, 0.0);
        }
        this.m_position.Add(this.m_velocity.GetScaled(deltaSeconds));

        // Reset acceleration: Acceleration is accumulated each frame
        this.m_acceleration = new Vec2(0.0, 0.0);
    }

    Render()
    {
        const ballVerts = [];
        VertexUtils.AddPCUVertsForDisc2D(ballVerts, this.m_position, Ball.RADIUS, Rgba8.WHITE, AABB2.ZERO_TO_ONE, 32);
        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(ballVerts);

        if (this.m_map.m_drawDebug)
        {
            this.RenderDebug();
        }
    }

    RenderDebug()
    {
        const ballDebugVerts = [];

        VertexUtils.AddPCUVertsForArrow2D(ballDebugVerts, this.m_position, this.m_position.GetSum(this.m_velocity), 1.0, 0.1, Rgba8.YELLOW);

        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(ballDebugVerts);
    }

    AddForce(force)
    {
        this.m_acceleration.Add(force.GetScaled(1.0 / Ball.MASS));
    }

    AddImpulse(impulse)
    {
        if (impulse.GetLengthSquared() === 0.0)
        {
            return;
        }

        this.m_velocity.Add(impulse.GetScaled(1.0 / Ball.MASS));
    }
}
