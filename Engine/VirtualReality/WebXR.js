"use strict";

import {g_renderer, g_webXR} from "/Engine/Core/EngineCommon.js";

import EulerAngles from "/Engine/Math/EulerAngles.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec2 from "/Engine/Math/Vec2.js";
import Vec3 from "/Engine/Math/Vec3.js";

import VRController from "/Engine/VirtualReality/VRController.js";


export class WebXRConfig
{
    constructor() {}
}

export default class WebXR
{
    constructor(config)
    {
        this.m_config = config;

        // Initialize variables
        this.m_initialized = false;
        this.m_views = [];
        this.m_glLayer = null;
    }

    Startup()
    {
    }

    async StartXRSession()
    {
        this.m_xrSession = await navigator.xr.requestSession("immersive-vr");
        this.m_xrReferenceSpace = await this.m_xrSession.requestReferenceSpace("local");
        this.m_initialized = true;
        g_renderer.m_context.makeXRCompatible();
        this.m_xrLayer = new XRWebGLLayer(this.m_xrSession, g_renderer.m_context);
        this.m_xrSession.updateRenderState({ baseLayer: this.m_xrLayer });
        // this.m_glLayer = this.m_xrSession.renderState.baseLayer;
    }

    BeginFrame(frame)
    {
        if (!frame)
        {
            return;
        }

        const pose = frame.getViewerPose(this.m_xrReferenceSpace);
        if (pose)
        {
            for (let view of pose.views)
            {
                this.m_views[view.eye] = view;
            }
        }
    }

    GetViewportForEye(eye)
    {
        if (!this.m_views[eye])
        {
            return [new Vec2(), new Vec2()];
        }

        const viewport = this.m_xrLayer.getViewport(this.m_views[eye]);
        return [new Vec2(viewport.x, viewport.y) , new Vec2(viewport.width, viewport.height)];
    }

    GetFrameBuffer()
    {
        return this.m_xrLayer.framebuffer;
    }

    GetPositionForEye_iFwd_jLeft_kUp(eye)
    {
        if (!this.m_views[eye])
        {
            return new Vec3();
        }

        return new Vec3(-this.m_views[eye].transform.position.z, -this.m_views[eye].transform.position.x, this.m_views[eye].transform.position.y);
    }

    GetOrientationForEye_iFwd_jLeft_kUp(eye)
    {
        if (!this.m_views[eye])
        {
            return new EulerAngles();
        }

        return MathUtils.GetEulerAnglesFromQuaternion(-this.m_views[eye].transform.orientation.z, -this.m_views[eye].transform.orientation.x, this.m_views[eye].transform.orientation.y, this.m_views[eye].transform.orientation.w);
    }

    GetFoVsForEye(eye)
    {
        if (!this.m_views[eye])
        {
            return;
        }

        const fovs = [];

        const projectionMatrix = this.m_views[eye].projectionMatrix;

        // Obscure code to extract fovs from WebXR projection matrix;
        fovs["left"] = Math.atan((projectionMatrix[8] - 1.0) / projectionMatrix[0]);
        fovs["right"] = Math.atan((projectionMatrix[8] + 1.0) / projectionMatrix[0]);
        fovs["up"] = Math.atan((projectionMatrix[9] + 1.0) / projectionMatrix[5]);
        fovs["down"] = Math.atan((projectionMatrix[9] - 1.0) / projectionMatrix[5]);

        return fovs;
    }

    EndFrame()
    {

    }

    Shutdown()
    {

    }
}

