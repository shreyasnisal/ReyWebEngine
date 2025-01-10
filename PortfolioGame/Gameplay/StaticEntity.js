"use strict";

import * as GameCommon from "/PortfolioGame/Framework/GameCommon.js";

import {g_renderer} from "/Engine/Core/EngineCommon.js";

import Rgba8 from "/Engine/Core/Rgba8.js";
import * as VertexUtils from "/Engine/Core/VertexUtils.js";

import AABB3 from "/Engine/Math/AABB3.js";
import Mat44 from "/Engine/Math/Mat44.js";
import Vec3 from "/Engine/Math/Vec3.js";

import { BlendMode, CullMode, DepthMode } from "/Engine/Renderer/Renderer.js";


export default class StaticEntity
{
    constructor(map, position, definition)
    {
        this.m_map = map;
        this.m_definition = definition;

        this.m_position = position.GetSum(this.m_definition.m_position);
        this.m_orientation = this.m_definition.m_orientation;

        const modelMatrix = new Mat44();
        modelMatrix.AppendTranslation3D(this.m_position);
        modelMatrix.Append(this.m_orientation.GetAsMatrix_iFwd_jLeft_kUp());
        modelMatrix.AppendScaleUniform3D(this.m_definition.m_scale);

        const tempBounds = new AABB3(this.m_definition.m_bounds.m_mins, this.m_definition.m_bounds.m_maxs);
        tempBounds.m_mins = modelMatrix.TransformPosition3D(tempBounds.m_mins);
        tempBounds.m_maxs = modelMatrix.TransformPosition3D(tempBounds.m_maxs);
        this.m_bounds = new AABB3();
        this.m_bounds.m_mins = new Vec3(Math.min(tempBounds.m_mins.x, tempBounds.m_maxs.x), Math.min(tempBounds.m_mins.y, tempBounds.m_maxs.y), Math.min(tempBounds.m_mins.z, tempBounds.m_maxs.z));
        this.m_bounds.m_maxs = new Vec3(Math.max(tempBounds.m_mins.x, tempBounds.m_maxs.x), Math.max(tempBounds.m_mins.y, tempBounds.m_maxs.y), Math.max(tempBounds.m_mins.z, tempBounds.m_maxs.z));
    }

    Update()
    {
        const deltaSeconds = this.m_map.m_game.m_clock.GetDeltaSeconds();

        this.m_orientation.m_yawDegrees += this.m_definition.m_angularVelocity.m_yawDegrees * deltaSeconds;
    }

    Render()
    {
        if (this.m_definition.m_model == null)
        {
            return;
        }

        const modelMatrix = new Mat44();
        modelMatrix.AppendTranslation3D(this.m_position);
        modelMatrix.Append(this.m_orientation.GetAsMatrix_iFwd_jLeft_kUp());
        modelMatrix.AppendScaleUniform3D(this.m_definition.m_scale);

        g_renderer.SetBlendMode(BlendMode.OPAQUE);
        g_renderer.SetDepthMode(DepthMode.ENABLED);
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetModelConstants(modelMatrix);
        g_renderer.BindTexture(this.m_definition.m_texture);
        for (let modelGroupIndex = 0; modelGroupIndex < this.m_definition.m_model.m_modelGroups.length; modelGroupIndex++)
        {
            g_renderer.DrawVertexBuffer(this.m_definition.m_model.m_modelGroups[modelGroupIndex].m_gpuMesh.m_vertexBuffer, this.m_definition.m_model.m_modelGroups[modelGroupIndex].m_cpuMesh.m_vertexes.length);
        }

        if (this.m_map.m_debugDrawEntityCollisions)
        {
            const debugCollisionVerts = [];
            VertexUtils.AddPCUTBNVertsForAABB3(debugCollisionVerts, this.m_bounds, Rgba8.MAGENTA);
            g_renderer.SetModelConstants();
            g_renderer.DrawVertexArray(debugCollisionVerts);
        }
    }
}
