"use strict";

import {g_renderer, g_webXR} from "/Engine/Core/EngineCommon.js";

import EulerAngles from "/Engine/Math/EulerAngles.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
import Vec3 from "/Engine/Math/Vec3.js";


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
        this.m_hmdPosition = new Vec3();
        this.m_hmdOrientation = new EulerAngles();
    }

    Startup()
    {
    }

    async StartXRSession()
    {
        // Request a VR session
        this.m_xrSession = await navigator.xr.requestSession("immersive-vr");
        this.m_xrReferenceSpace = await this.m_xrSession.requestReferenceSpace("local");

        // Configure renderer for XR and set session state
        g_renderer.setXRSession(this.m_xrSession, this.m_xrReferenceSpace);
        this.m_initialized = true;
    }

    GetHMDPosition()
    {
        return this.m_hmdPosition;
    }

    GetHMDOrientation()
    {
        return this.m_hmdOrientation;
    }

    BeginFrame(frame)
    {
        const pose = frame.getViewerPose(this.m_xrReferenceSpace);
        this.m_hmdPosition = new Vec3(-pose.transform.position.z, -pose.transform.position.x, pose.transform.position.y);
        this.m_hmdOrientation = MathUtils.GetEulerAnglesFromQuaternion(-pose.transform.orientation.z, -pose.transform.orientation.x, pose.transform.orientation.y, pose.transform.orientation.w);
    }

    EndFrame()
    {

    }

    Shutdown()
    {

    }

    renderXR(time, frame)
    {
        const session = frame.session;
        const glLayer = session.renderState.baseLayer;
        session.requestAnimationFrame(this.renderXR.bind(this));
        const pose = frame.getViewerPose(g_webXR.m_xrReferenceSpace);
        g_renderer.m_context.bindFramebuffer(g_renderer.m_context.FRAMEBUFFER, glLayer.framebuffer);
        g_renderer.m_context.clear(g_renderer.m_context.COLOR_BUFFER_BIT | g_renderer.m_context.DEPTH_BUFFER_BIT);
        for (const view of pose.views) {
            let viewport = glLayer.getViewport(view);
            g_renderer.m_context.viewport(viewport.x, viewport.y,
                viewport.width, viewport.height);
        }
    }
}

