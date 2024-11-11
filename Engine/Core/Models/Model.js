"use strict";

import CPUMesh from "/Engine/Core/Models/CPUMesh.js";
import GPUMesh from "/Engine/Core/Models/GPUMesh.js";


export class ModelGroup
{
    constructor(name = "", cpuMesh = new CPUMesh(), gpuMesh = null)
    {
        this.m_name = name;
        this.m_cpuMesh = cpuMesh;
        this.m_gpuMesh = gpuMesh;
    }
}

export default class Model
{
    constructor(name, modelGroups)
    {
        this.m_name = name;
        this.m_modelGroups = modelGroups;
    }
}
