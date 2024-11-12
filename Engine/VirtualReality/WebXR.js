"use strict";

import {g_renderer, g_webXR} from "/Engine/Core/EngineCommon.js";

import EulerAngles from "/Engine/Math/EulerAngles.js";
import * as MathUtils from "/Engine/Math/MathUtils.js";
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
        this.m_leftEyePosition = new Vec3();
        this.m_leftEyeOrientation = new EulerAngles();
        this.m_rightEyePosition = new Vec3();
        this.m_rightEyeOrientation = new EulerAngles();
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

    BeginFrame(frame)
    {
        const pose = frame.getViewerPose(this.m_xrReferenceSpace);
        if (pose)
        {
            for (let view in pose.views)
            {
                if (view.eye === "left")
                {
                    this.m_leftEyePosition = new Vec3(-view.transform.position.z, -view.transform.position.x, view.transform.position.y);
                    this.m_leftEyeOrientation = MathUtils.GetEulerAnglesFromQuaternion(-view.transform.orientation.z, -view.transform.orientation.x, view.transform.orientation.y, view.transform.orientation.w);
                }
                else if (view.eye === "right")
                {
                    this.m_rightEyePosition = new Vec3(-view.transform.position.z, -view.transform.position.x, view.transform.position.y);
                    this.m_rightEyeOrientation = MathUtils.GetEulerAnglesFromQuaternion(-view.transform.orientation.z, -view.transform.orientation.x, view.transform.orientation.y, view.transform.orientation.w);
                }
            }
        }
    }

    EndFrame()
    {

    }

    Shutdown()
    {

    }
}

