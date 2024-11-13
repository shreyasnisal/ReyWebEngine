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
        this.m_isImmersiveSupported = false;
        this.m_initialized = false;
        this.m_views = [];
        this.m_leftController = null;
        this.m_rightController = null;
    }

    Startup()
    {
        this.SetVRSupported();
    }

    async SetVRSupported()
    {
        this.m_isImmersiveSupported = await navigator.xr.isSessionSupported("immersive-vr");
    }

    IsVRSupported()
    {
        return this.m_isImmersiveSupported;
    }

    async StartXRSession(callback)
    {
        this.m_xrSession = await navigator.xr.requestSession("immersive-vr");
        this.m_xrReferenceSpace = await this.m_xrSession.requestReferenceSpace("local");
        g_renderer.m_context.makeXRCompatible();
        this.m_xrLayer = new XRWebGLLayer(this.m_xrSession, g_renderer.m_context);
        this.m_xrSession.updateRenderState({ baseLayer: this.m_xrLayer });
        this.m_initialized = true;
        this.m_xrSession.requestAnimationFrame(callback);

        this.m_xrSession.addEventListener("inputsourceschange", (inputSourcesEvent) => { this.HandleNewInputSources(inputSourcesEvent); });
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

        if (this.m_leftController)
        {
            this.m_leftController.Update(frame);
        }
        if (this.m_rightController)
        {
            this.m_rightController.Update(frame);
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

    HandleNewInputSources(inputSourcesEvent)
    {
        inputSourcesEvent.added.forEach(newInputSource => {
            if (newInputSource.targetRayMode === "tracked-pointer" && newInputSource)
            {
                if (newInputSource.handedness === "left")
                {
                    this.m_leftController = new VRController("left", newInputSource);
                }
                else if (newInputSource.handedness === "right")
                {
                    this.m_rightController = new VRController("right", newInputSource);
                }
            }
        });
    }

    GetLeftController()
    {
        return this.m_leftController;
    }

    GetRightController()
    {
        return this.m_rightController;
    }
}

