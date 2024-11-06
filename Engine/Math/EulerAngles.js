"use strict";

import Mat44 from "../../Engine/Math/Mat44.js";


export default class EulerAngles
{
    constructor(yawDegrees = 0.0, pitchDegrees = 0.0, rollDegrees = 0.0)
    {
        this.m_yawDegrees = yawDegrees;
        this.m_pitchDegrees = pitchDegrees;
        this.m_rollDegrees = rollDegrees;
    }

    GetAsMatrix_iFwd_jLeft_kUp()
    {
        const matrix = new Mat44();
        matrix.AppendZRotation(this.m_yawDegrees);
        matrix.AppendYRotation(this.m_pitchDegrees);
        matrix.AppendXRotation(this.m_rollDegrees);
        return matrix;
    }
}
