"use strict";

import { g_renderer } from "../../Sandbox/Framework/GameCommon.js";

import * as VertexUtils from "../../Engine/Core/VertexUtils.js";
import Rgba8 from "../../Engine/Core/Rgba8.js";
import EulerAngles from "../../Engine/Math/EulerAngles.js";
import Vec3 from "../../Engine/Math/Vec3.js";
import Camera from "../../Engine/Renderer/Camera.js";
import {CullMode, DepthMode, g_viewportHeight, g_viewportWidth} from "../../Engine/Renderer/Renderer.js";

export default class Game
{
    constructor()
    {
        // Initialize world camera
        this.m_worldCamera = new Camera();
        this.m_worldCamera.SetRenderBasis(Vec3.SKYWARD, Vec3.WEST, Vec3.NORTH);
        this.m_worldCamera.SetTransform(new Vec3(-2.0, 0.0, 0.0));

        // Create a test cube
        this.m_testCubeVertexes = [];
        const BLF = new Vec3(-0.5, 0.5, -0.5);
        const BRF = new Vec3(-0.5, -0.5, -0.5);
        const TRF = new Vec3(-0.5, -0.5, 0.5);
        const TLF = new Vec3(-0.5, 0.5, 0.5);
        const BLB = new Vec3(0.5, 0.5, -0.5);
        const BRB = new Vec3(0.5, -0.5, -0.5);
        const TRB = new Vec3(0.5, -0.5, 0.5);
        const TLB = new Vec3(0.5, 0.5, 0.5);
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BRB, BLB, TLB, TRB, Rgba8.RED); // back face (+X)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLF, BRF, TRF, TLF, Rgba8.CYAN); // front face (-X)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLB, BLF, TLF, TLB, Rgba8.LIME); // left face (+Y)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BRF, BRB, TRB, TRF, Rgba8.MAGENTA); // right face (-Y)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, TLF, TRF, TRB, TLB, Rgba8.BLUE); // top face (+Z)
        VertexUtils.AddPCUVertsForQuad3D(this.m_testCubeVertexes, BLB, BRB, BRF, BLF, Rgba8.YELLOW); // bottom face (-Z)
        this.m_cubeOrientation = new EulerAngles(0.0, 0.0, 0.0);
    }

    Update(deltaSeconds)
    {
        this.m_cubeOrientation.m_yawDegrees += 45.0 * deltaSeconds;
        this.m_cubeOrientation.m_pitchDegrees += 30.0 * deltaSeconds;

        this.UpdateCameras();
    }

    UpdateCameras()
    {
        this.m_worldCamera.SetPerspectiveView(g_viewportWidth / g_viewportHeight, 90.0, 0.01, 100);
    }

    Render()
    {
        const cubeTransform = this.m_cubeOrientation.GetAsMatrix_iFwd_jLeft_kUp();

        g_renderer.BeginCamera(this.m_worldCamera);
        g_renderer.ClearScreen(new Rgba8(0, 0, 0));
        g_renderer.SetCullMode(CullMode.BACK);
        g_renderer.SetDepthMode(DepthMode.ENABLED);
        g_renderer.SetModelConstants(cubeTransform);
        g_renderer.DrawVertexArray(this.m_testCubeVertexes);
        g_renderer.EndCamera(this.m_worldCamera);
    }
}