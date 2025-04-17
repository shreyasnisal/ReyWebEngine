"use strict";

import {
    GetTeamColor,
    SHADOW_COLOR, SHADOW_OFFSET_X,
    SHADOW_OFFSET_Y,
    WORLD_SIZE_X,
    WORLD_SIZE_Y
} from "/ThrottleBall/Framework/GameCommon.js";

import { g_renderer } from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB2 from "/Engine/Math/AABB2.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";

import {BlendMode, CullMode, DepthMode, SamplerMode} from "/Engine/Renderer/Renderer.js";


export default class Goal
{
    static POLE_ELASTICITY = 0.8;

    constructor(map, position, orientation, team)
    {
        this.m_map = map;
        this.m_position = position;
        this.m_orientation = orientation;
        this.m_team = team;

        this.m_netTexture = null;
        g_renderer.CreateOrGetTextureFromFile("/ThrottleBall/Data/Images/GoalNet.png").then(loadedTexture =>
        {
            this.m_netTexture = loadedTexture;
        });
    }

    Update()
    {
        // Why tf do I have this method?
    }

    Render()
    {
        const goalVerts = [];
        const goalPostVerts = [];

        const bounds = this.GetBounds();

        VertexUtils.AddPCUVertsForAABB2(goalVerts, bounds, GetTeamColor(this.m_team), new AABB2(new Vec2(), new Vec2(2.0, 2.0)));
        g_renderer.BindShader(null);
        g_renderer.BindTexture(this.m_netTexture);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetSamplerMode(SamplerMode.BILINEAR_WRAP);
        g_renderer.SetModelConstants();
        g_renderer.DrawVertexArray(goalVerts);

        VertexUtils.AddPCUVertsForAABB2(goalPostVerts, new AABB2(new Vec2(bounds.m_mins.x, bounds.m_maxs.y), bounds.m_maxs.GetSum(new Vec2(0.0, 1.0))), Rgba8.WHITE);
        VertexUtils.AddPCUVertsForAABB2(goalPostVerts, new AABB2(bounds.m_mins.GetDifference(new Vec2(0.0, 1.0)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y)), Rgba8.WHITE);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(goalPostVerts);

        if (this.m_map.m_drawDebug)
        {
            this.RenderDebug();
        }
    }

    RenderShadow()
    {
        const netShadowVerts = [];
        const postShadowVerts = [];

        const bounds = this.GetBounds();

        VertexUtils.AddPCUVertsForAABB2(netShadowVerts, new AABB2(bounds.m_mins.GetDifference(new Vec2(-SHADOW_OFFSET_X, SHADOW_OFFSET_Y)), bounds.m_maxs.GetDifference(new Vec2(SHADOW_OFFSET_X, SHADOW_OFFSET_Y))), SHADOW_COLOR, new AABB2(new Vec2(), new Vec2(2.0, 2.0)));
        VertexUtils.AddPCUVertsForAABB2(postShadowVerts, new AABB2(new Vec2(bounds.m_mins.x, bounds.m_maxs.y - SHADOW_OFFSET_Y), bounds.m_maxs.GetSum(new Vec2(SHADOW_OFFSET_X, 1.0 - SHADOW_OFFSET_Y))), SHADOW_COLOR);
        VertexUtils.AddPCUVertsForAABB2(postShadowVerts, new AABB2(bounds.m_mins.GetDifference(new Vec2(0.0, 1.0 + SHADOW_OFFSET_Y)), new Vec2(bounds.m_maxs.x + SHADOW_OFFSET_X, bounds.m_mins.y - SHADOW_OFFSET_Y)), SHADOW_COLOR);
        g_renderer.BindShader(null);
        g_renderer.BindTexture(this.m_netTexture);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetSamplerMode(SamplerMode.BILINEAR_WRAP);
        g_renderer.SetModelConstants();
        g_renderer.DrawVertexArray(netShadowVerts);
        g_renderer.BindTexture(null);
        g_renderer.DrawVertexArray(postShadowVerts);
    }

    RenderDebug()
    {
        const goalDebugVerts = [];
        VertexUtils.AddPCUVertsForArrow2D(goalDebugVerts, this.m_position, this.m_position.GetSum(this.GetForwardNormal().GetScaled(WORLD_SIZE_X * 0.02)), 1.0, 0.1, Rgba8.RED);
        g_renderer.BindShader(null);
        g_renderer.BindTexture(null);
        g_renderer.SetBlendMode(BlendMode.ALPHA);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.DISABLED);
        g_renderer.SetModelConstants();
        g_renderer.DrawVertexArray(goalDebugVerts);
    }

    GetForwardNormal()
    {
        return new Vec2(MathUtils.CosDegrees(this.m_orientation), MathUtils.SinDegrees(this.m_orientation));
    }

    GetBounds()
    {
        return new AABB2(this.m_position.GetDifference(new Vec2(WORLD_SIZE_X * 0.02, WORLD_SIZE_Y * 0.1)), this.m_position.GetSum(new Vec2(WORLD_SIZE_X * 0.02, WORLD_SIZE_Y * 0.1)));
    }

    GetGoalPostBounds()
    {
        const bounds = this.GetBounds();
        return [new AABB2(new Vec2(bounds.m_mins.x, bounds.m_maxs.y), bounds.m_maxs.GetSum(new Vec2(0.0, 1.0))), new AABB2(bounds.m_mins.GetDifference(new Vec2(0.0, 1.0)), new Vec2(bounds.m_maxs.x, bounds.m_mins.y))]
    }
}
