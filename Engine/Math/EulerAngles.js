"use strict";

import Mat44 from "../../Engine/Math/Mat44.js";
import Vec3 from "../../Engine/Math/Vec3.js";


export default class EulerAngles
{
    static ZERO = new EulerAngles(0.0, 0.0, 0.0);

    constructor(yawDegrees = 0.0, pitchDegrees = 0.0, rollDegrees = 0.0)
    {
        this.m_yawDegrees = yawDegrees;
        this.m_pitchDegrees = pitchDegrees;
        this.m_rollDegrees = rollDegrees;
    }

    toString()
    {
        return "(" + this.m_yawDegrees + "," + this.m_pitchDegrees + "," + this.m_rollDegrees + ")";
    }

    GetAsMatrix_iFwd_jLeft_kUp()
    {
        const matrix = new Mat44();
        matrix.AppendZRotation(this.m_yawDegrees);
        matrix.AppendYRotation(this.m_pitchDegrees);
        matrix.AppendXRotation(this.m_rollDegrees);
        return matrix;
    }

    GetAsVectors_iFwd_jLeft_kUp()
    {
        const eulerAnglesMatrix = this.GetAsMatrix_iFwd_jLeft_kUp();
        const iBasis = eulerAnglesMatrix.GetIBasis3D();
        const jBasis = eulerAnglesMatrix.GetJBasis3D();
        const kBasis = eulerAnglesMatrix.GetKBasis3D();

        return [new Vec3(iBasis.x, iBasis.y, iBasis.z), new Vec3(jBasis.x, jBasis.y, jBasis.z), new Vec3(kBasis.x, kBasis.y, kBasis.z)];
    }
}
