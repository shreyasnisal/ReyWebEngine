"use strict";


export default class Shader
{
    constructor(name)
    {
        this.m_name = name;
        this.m_vertexShader = null;
        this.m_fragmentShader = null;
        this.m_program = null;
        this.m_vertexType = null;
    }
}