"use strict";

import AABB2 from "/Engine/Math/AABB2.js"
import EulerAngles from "/Engine/Math/EulerAngles.js";
import Mat44 from "/Engine/Math/Mat44.js"
import Vec2 from "/Engine/Math/Vec2.js"
import Vec3 from "/Engine/Math/Vec3.js"
import Vec4 from "/Engine/Math/Vec4.js"


class CameraMode
{
    static ORTHOGRAPHIC = "ORTHOGRAPHIC";
    static PERSPECTIVE = "PERSPECTIVE";
    static VR_PERSPECTIVE = "VR_PERSPECTIVE";
}

export default class Camera
{
    constructor()
    {
        this.m_position = new Vec3(Vec3.ZERO.x, Vec3.ZERO.y, Vec3.ZERO.z);
        this.m_orientation = new EulerAngles(EulerAngles.ZERO.m_yawDegrees, EulerAngles.ZERO.m_pitchDegrees, EulerAngles.ZERO.m_rollDegrees);
        this.m_mode = CameraMode.ORTHOGRAPHIC;
        this.m_orthoView = new AABB2(Vec2.ZERO, Vec2.ZERO);
        this.m_orthoNear = 0.0;
        this.m_orthoFar = 0.0;
        this.m_perspectiveAspect = 0.0;
        this.m_perspectiveFov = 0.0;
        this.m_perspectiveNear = 0.0;
        this.m_perspectiveFar = 0.0;
        this.m_vrFovLeft = 0.0;
        this.m_vrFovRight = 0.0;
        this.m_vrFovUp = 0.0;
        this.m_vrFovDown = 0.0;
        this.m_vrNear = 0.0;
        this.m_vrFar = 0.0;
        this.m_renderIBasis = Vec4.EAST;
        this.m_renderJBasis = Vec4.NORTH;
        this.m_renderKBasis = Vec4.SKYWARD;
    }

    SetOrthoView(mins, maxs, orthoNear = 0.0, orthoFar = 1.0)
    {
        this.m_mode = CameraMode.ORTHOGRAPHIC;
        this.m_orthoView = new AABB2(mins, maxs);
        this.m_orthoNear = orthoNear;
        this.m_orthoFar = orthoFar;
    }

    SetPerspectiveView(aspect, fov, perspectiveNear, perspectiveFar)
    {
        this.m_mode = CameraMode.PERSPECTIVE;
        this.m_perspectiveAspect = aspect;
        this.m_perspectiveFov = fov;
        this.m_perspectiveNear = perspectiveNear;
        this.m_perspectiveFar = perspectiveFar;
    }

    SetVRPerspectiveView(fovLeft, fovRight, fovUp, fovDown, near, far)
    {
        this.m_mode = CameraMode.VR_PERSPECTIVE;
        this.m_vrFovLeft = fovLeft;
        this.m_vrFovRight = fovRight;
        this.m_vrFovUp = fovUp;
        this.m_vrFovDown = fovDown;
        this.m_vrNear = near;
        this.m_vrFar = far;

    }

    SetRenderBasis(iBasis, jBasis, kBasis)
    {
        this.m_renderIBasis = new Vec4(iBasis.x, iBasis.y, iBasis.z, 0.0);
        this.m_renderJBasis = new Vec4(jBasis.x, jBasis.y, jBasis.z, 0.0);
        this.m_renderKBasis = new Vec4(kBasis.x, kBasis.y, kBasis.z, 0.0);
    }

    SetTransform(position, orientation)
    {
        this.m_position = position;
        this.m_orientation = orientation;
    }

    GetOrthoBottomLeft()
    {
        return this.m_orthoView.m_mins;
    }

    GetOrthoTopRight()
    {
        return this.m_orthoView.m_maxs;
    }

    GetOrthoBounds()
    {
        return new AABB2(this.m_orthoView.m_mins, this.m_orthoView.m_maxs);
    }

    Translate2D(translationXY)
    {
        this.m_orthoView.SetCenter(this.m_orthoView.GetCenter().GetSum(translationXY));
    }

    Translate3D(translationXYZ)
    {
        this.m_position.Add(translationXYZ);
    }

    GetModelMatrix()
    {
    }

    GetOrthoMatrix()
    {
        return Mat44.CreateOrthoProjection(this.m_orthoView.m_mins.x, this.m_orthoView.m_maxs.x, this.m_orthoView.m_mins.y, this.m_orthoView.m_maxs.y, this.m_orthoNear, this.m_orthoFar);
    }

    GetPerspectiveMatrix()
    {
        return Mat44.CreatePerspectiveProjection(this.m_perspectiveFov, this.m_perspectiveAspect, this.m_perspectiveNear, this.m_perspectiveFar);
    }

    GetVRPerspectiveMatrix()
    {
        return Mat44.CreateOffCenterPerspectiveProjection(this.m_vrFovLeft, this.m_vrFovRight, this.m_vrFovUp, this.m_vrFovDown, this.m_vrNear, this.m_vrFar);
    }

    GetViewMatrix()
    {
        const lookAtMatrix = Mat44.CreateTranslation3D(this.m_position);
        lookAtMatrix.Append(this.m_orientation.GetAsMatrix_iFwd_jLeft_kUp());
        return lookAtMatrix.GetOrthonormalInverse();
    }

    GetProjectionMatrix()
    {
        let projectionMatrix = new Mat44();

        if (this.m_mode === CameraMode.ORTHOGRAPHIC)
        {
            projectionMatrix = this.GetOrthoMatrix();
        }
        else if (this.m_mode === CameraMode.PERSPECTIVE)
        {
            projectionMatrix = this.GetPerspectiveMatrix();
        }
        else
        {
            projectionMatrix = this.GetVRPerspectiveMatrix();
        }

        const renderMatrix = this.GetRenderMatrix();
        projectionMatrix.Append(renderMatrix);
        return projectionMatrix;
    }

    GetRenderMatrix()
    {
        return new Mat44(this.m_renderIBasis, this.m_renderJBasis, this.m_renderKBasis, Vec4.ZERO_TRANSLATION);
    }
}