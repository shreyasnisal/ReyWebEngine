"use strict";

import Vertex_PCU from "/Engine/Core/Vertex_PCU.js";


export default class GPUMesh
{
    constructor(cpuMesh, renderer)
    {
        this.m_vertexBuffer = renderer.CreateVertexBuffer(cpuMesh.m_vertexes.length * Vertex_PCU.NUM_FLOAT32_ELEMENTS);
        renderer.CopyVertexBufferToGPU(cpuMesh.m_vertexes, cpuMesh.m_vertexes.length, this.m_vertexBuffer);
    }
}
