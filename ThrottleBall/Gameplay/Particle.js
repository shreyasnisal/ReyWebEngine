"use strict";

import { g_renderer } from "/Engine/Core/EngineCommon.js";

import Clock from "/Engine/Core/Clock.js";
import Rgba8 from "/Engine/Core/Rgba8.js";
import Stopwatch from "/Engine/Core/Stopwatch.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import Mat44 from "/Engine/Math/Mat44.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";

import {BlendMode, CullMode, DepthMode, SamplerMode} from "/Engine/Renderer/Renderer.js";


export default class Particle
{
    constructor(position, velocity, orientation, angularVel, minSize, maxSize, numVerts, color, lifetime, fadeOverLifetime = true)
    {
        this.m_position = position;
        this.m_velocity = velocity;
        this.m_color = new Rgba8(color.r, color.g, color.b, color.a);
        this.m_age = 0.0;
        this.m_fadeOverLifetime = fadeOverLifetime;
        this.m_orientation = orientation;
        this.m_angularVelocity = angularVel;
        this.m_lifetimeTimer = new Stopwatch(lifetime, Clock.SystemClock);
        this.m_lifetimeTimer.Start();

        // Construct verts here
        this.m_localVertexes = [];
        VertexUtils.AddPCUVertsForDisc2D(this.m_localVertexes, Vec2.ZERO, minSize);
    }

    Update(deltaSeconds)
    {
        if (this.m_fadeOverLifetime)
        {
            const fOpacity = MathUtils.Lerp(1.0, 0.0, this.m_lifetimeTimer.GetElapsedFraction());
            this.m_color.a = Math.floor(fOpacity * 255);
        }

        this.m_age += deltaSeconds;
        this.m_position.Add(this.m_velocity.GetScaled(deltaSeconds));
        this.m_orientation += this.m_angularVelocity * deltaSeconds;
    }

    Render()
    {
        const transform = Mat44.CreateTranslation2D(this.m_position);
        transform.AppendZRotation(this.m_orientation);

        g_renderer.BindShader(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetSamplerMode(SamplerMode.POINT_CLAMP);
        g_renderer.SetModelConstants(transform, this.m_color);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(this.m_localVertexes);
    }
}
