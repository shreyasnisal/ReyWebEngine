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
        this.m_hmdPosition = new Vec3();
        this.m_hmdOrientation = new EulerAngles();

        this.m_leftController = null;
        this.m_rightController = null;
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

        // this.m_xrSession.addEventListener("inputsourceschange", (inputSourceEvent) => { this.HandleNewInputSource(inputSourceEvent); } );
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

    HandleNewInputSource(inputSourceEvent)
    {
        inputSourceEvent.added.foreach((newInputSource) => {
            if (newInputSource.targetRayMode === "tracked-pointer" && newInputSource.gamepad)
            {
                if (newInputSource.handedness === "left")
                {
                    this.m_leftController = new VRController(newInputSource.gamepad);
                }
                else if (newInputSource.handedness === "right")
                {
                    this.m_rightController = new VRController(newInputSource.gamepad);
                }
            }
        });
    }
}

