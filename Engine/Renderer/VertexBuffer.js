"use strict";


export default class VertexBuffer
{
    constructor(size = 0)
    {
        this.m_size = size;
        this.m_stride = 0;
        this.m_buffer = null;
    }
}