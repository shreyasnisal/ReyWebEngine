"use strict";

import {SHADOW_COLOR, SHADOW_OFFSET_X, SHADOW_OFFSET_Y} from "/ThrottleBall/Framework/GameCommon.js";

import {g_debugRenderSystem, g_renderer} from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import Vec2 from "/Engine/Math/Vec2.js";

import {BlendMode, CullMode, DepthMode, SamplerMode} from "/Engine/Renderer/Renderer.js";


export default class Ball
{
    // To change the friction, change ONLY the COEFFICIENTS!
    static ROLLING_FRICTION_COEFFICIENT = 0.005;
    static RADIUS = 4.0;
    static MASS = 1.0;
    static ELASTICITY = 0.9;
    static MAX_VELOCITY = 100.0;

    // Don't change these values
    static ROLLING_FRICTION = Ball.ROLLING_FRICTION_COEFFICIENT * 100.0;

    constructor(map, position)
    {
        this.m_map = map;
        this.m_position = position;

        this.m_velocity = new Vec2(0.0, 0.0);
        this.m_acceleration = new Vec2(0.0, 0.0);

        this.m_texture = null;
        g_renderer.CreateOrGetTextureFromFile("/ThrottleBall/Data/Images/Ball.png").then(loadedTexture =>
        {
            this.m_texture = loadedTexture;
        })

        this.m_uvOffset = new Vec2(0.0, 0.0);
    }

    Update()
    {
        const deltaSeconds = this.m_map.m_game.m_clock.GetDeltaSeconds();

        this.m_velocity.Add(this.m_acceleration.GetScaled(deltaSeconds));

        const momentum = this.m_velocity.GetScaled(Ball.MASS);
        const rollingFrictionThisFrame = Ball.ROLLING_FRICTION * deltaSeconds;
        const momentumAfterFriction = momentum.GetDifference(momentum.GetScaled(rollingFrictionThisFrame)); // This should not be the same as AddForce
        this.m_velocity = momentumAfterFriction.GetScaled(1.0 / Ball.MASS);

        this.m_velocity.ClampLength(Ball.MAX_VELOCITY);

        // Stop moving if the velocity is super low
        if (this.m_velocity.GetLengthSquared() < 0.01)
        {
            this.m_velocity = new Vec2(0.0, 0.0);
        }
        this.m_position.Add(this.m_velocity.GetScaled(deltaSeconds));

        // Reset acceleration: Acceleration is accumulated each frame
        this.m_acceleration = new Vec2(0.0, 0.0);

        this.m_uvOffset.Add(this.m_velocity.GetScaled(-0.002));
    }

    Render()
    {
        const ballVerts = [];

        const uvMins = new Vec2(this.m_uvOffset.x % 2.0, this.m_uvOffset.y % 2.0);
        const uvMaxs = uvMins.GetSum(new Vec2(2.0, 2.0));
        const uvs = new AABB2(uvMins, uvMaxs);

        VertexUtils.AddPCUVertsForDiscWithOutline2D(ballVerts, this.m_position, Ball.RADIUS, Ball.RADIUS * 0.25,  Rgba8.WHITE, uvs, 32);
        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetSamplerMode(SamplerMode.BILINEAR_WRAP);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(this.m_texture);
        // g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(ballVerts);

        if (this.m_map.m_drawDebug)
        {
            this.RenderDebug();
        }
    }

    RenderShadow()
    {
        const shadowVerts = [];
        const shadowPosition = this.m_position.GetSum(Vec2.EAST.GetScaled(SHADOW_OFFSET_X)).GetSum(Vec2.SOUTH.GetScaled(SHADOW_OFFSET_Y));
        VertexUtils.AddPCUVertsForDisc2D(shadowVerts, shadowPosition, Ball.RADIUS, SHADOW_COLOR, AABB2.ZERO_TO_ONE, 32);
        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetSamplerMode(SamplerMode.BILINEAR_WRAP);
        g_renderer.SetModelConstants();
        g_renderer.BindTexture(this.m_texture);
        g_renderer.DrawVertexArray(shadowVerts);
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
