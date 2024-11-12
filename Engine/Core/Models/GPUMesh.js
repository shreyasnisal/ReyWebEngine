"use strict";

import Vertex_PCUTBN from "/Engine/Core/Vertex_PCUTBN.js";
import { VertexType } from "/Engine/Renderer/Renderer.js";


export default class GPUMesh
{
    constructor(cpuMesh, renderer)
    {
        this.m_vertexBuffer = renderer.CreateVertexBuffer(cpuMesh.m_vertexes.length * Vertex_PCUTBN.NUM_FLOAT32_ELEMENTS, VertexType.VERTEX_PCUTBN);
        renderer.CopyVertexBufferToGPU(cpuMesh.m_vertexes, cpuMesh.m_vertexes.length, this.m_vertexBuffer);
    }
}
