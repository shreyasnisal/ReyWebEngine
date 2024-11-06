import * as MathUtils from "../../Engine/Math/MathUtils.js"
import { defaultVertexShader, defaultFragmentShader } from "../../Engine/Renderer/DefaultShader.js";
import Rgba8 from "../../Engine/Core/Rgba8.js";
import Vertex_PCU from "../../Engine/Core/Vertex_PCU.js";
import Vertex_PCUTBN from "../../Engine/Core/Vertex_PCUTBN.js";
import Mat44 from "../../Engine/Math/Mat44.js"
import VertexBuffer from "../../Engine/Renderer/VertexBuffer.js";

export const g_viewportWidth = window.innerWidth;
export const g_viewportHeight = window.innerHeight;

export class VertexType
{
    static VERTEX_PCU = "VERTEX_PCU";
    static VERTEX_PCUTBN = "Vertex_PCUTBN";
}

export class RenderConfig
{
    constructor()
    {
    }
}

export default class Renderer
{
    constructor(config)
    {
        const canvas = document.getElementById("id_canvas");
        canvas.width = g_viewportWidth;
        canvas.height = g_viewportHeight;
        this.m_context = canvas.getContext("webgl2");
        if (!this.m_context)
        {
            console.error("webgl2 is not supported");
        }
        this.m_config = config;
    }

    Startup()
    {
        // Create the WebGL program
        this.m_webglProgram = this.m_context.createProgram();

        // Create, compile and attach vertex shader to the WebGL program
        const vertexShader = this.m_context.createShader(this.m_context.VERTEX_SHADER);
        this.m_context.shaderSource(vertexShader, defaultVertexShader);
        this.m_context.compileShader(vertexShader);
        if (!this.m_context.getShaderParameter(vertexShader, this.m_context.COMPILE_STATUS))
        {
            const compileError = this.m_context.getShaderInfoLog(vertexShader);
            console.error(compileError);
        }
        this.m_context.attachShader(this.m_webglProgram, vertexShader);

        // Create, compile and attach fragment shader to the WebGL program
        const fragmentShader = this.m_context.createShader(this.m_context.FRAGMENT_SHADER);
        this.m_context.shaderSource(fragmentShader, defaultFragmentShader);
        this.m_context.compileShader(fragmentShader);
        if (!this.m_context.getShaderParameter(fragmentShader, this.m_context.COMPILE_STATUS))
        {
            const compileError = this.m_context.getShaderInfoLog(fragmentShader);
            console.error(compileError);
        }
        this.m_context.attachShader(this.m_webglProgram, fragmentShader);

        // Link the program
        this.m_context.linkProgram(this.m_webglProgram);
        if (!this.m_context.getProgramParameter(this.m_webglProgram, this.m_context.LINK_STATUS))
        {
            const linkError = this.m_context.getProgramInfoLog(this.m_webglProgram);
            console.error(linkError);
        }

        // Set the program as the currently used program
        this.m_context.useProgram(this.m_webglProgram);

        // Create an immediate vertex buffer to copy data into when passing vertexes
        this.m_immediateVBO = this.CreateVertexBuffer(Vertex_PCU.NUM_FLOAT32_ELEMENTS * 4);

        // Set viewport
        this.m_context.viewport(0, 0, g_viewportWidth, g_viewportHeight);
    }

    BeginFrame()
    {

    }

    EndFrame()
    {

    }

    Shutdown()
    {

    }

    BeginCamera(camera)
    {
        this.m_camera = camera;

        const cameraConstantsCpuBuffer = new Float32Array(32);

        const viewMatrixValues = camera.GetViewMatrix().m_values;

        for (let i = 0; i < 16; i++)
        {
            cameraConstantsCpuBuffer[i] = viewMatrixValues[i];
        }

        const projectionMatrixValues = camera.GetProjectionMatrix().m_values;
        for (let i = 0; i < 16; i++)
        {
            cameraConstantsCpuBuffer[16 + i] = projectionMatrixValues[i];
        }

        const cameraConstantsGpuBuffer = this.m_context.createBuffer();
        this.m_context.bindBuffer(this.m_context.UNIFORM_BUFFER, cameraConstantsGpuBuffer);
        this.m_context.bufferData(this.m_context.UNIFORM_BUFFER, 32 * 4, this.m_context.STATIC_DRAW);
        this.m_context.bindBufferRange(this.m_context.UNIFORM_BUFFER, 0, cameraConstantsGpuBuffer, 0, 32 * 4);

        this.m_context.uniformBlockBinding(this.m_webglProgram, this.m_context.getUniformBlockIndex(this.m_webglProgram, "CameraConstants"), 0);

        this.m_context.bindBuffer(this.m_context.UNIFORM_BUFFER, cameraConstantsGpuBuffer);
        this.m_context.bufferSubData(this.m_context.UNIFORM_BUFFER, 0, cameraConstantsCpuBuffer);
    }

    EndCamera(camera)
    {

    }

    ClearScreen(clearColor)
    {
        this.m_context.clearColor(MathUtils.NormalizeByte(clearColor.r), MathUtils.NormalizeByte(clearColor.g), MathUtils.NormalizeByte(clearColor.b), MathUtils.NormalizeByte(clearColor.a));
        this.m_context.clear(this.m_context.COLOR_BUFFER_BIT | this.m_context.DEPTH_BUFFER_BIT);
    }

    DrawVertexArray(vertexes)
    {
        this.m_immediateVBO.m_stride = Vertex_PCU.NUM_FLOAT32_ELEMENTS;
        this.CopyVertexBufferToGPU(vertexes, vertexes.length, this.m_immediateVBO);
        this.DrawVertexBuffer(this.m_immediateVBO, vertexes.length);
    }

    DrawVertexBuffer(vbo, numVertexes)
    {
        this.BindVertexBuffer(vbo);
        this.m_context.drawArrays(this.m_context.TRIANGLES, 0, numVertexes);
    }

    SetModelConstants(modelMatrix = Mat44.IDENTITY, modelColor = Rgba8.WHITE)
    {
        const modelConstantsCpuBuffer = new Float32Array(20);
        for (let matrixElemIndex = 0; matrixElemIndex < Mat44.SIZE; matrixElemIndex++)
        {
            modelConstantsCpuBuffer[matrixElemIndex] = modelMatrix.m_values[matrixElemIndex];
        }

        const modelColorAsFloats = modelColor.GetAsFloats();
    }

    CreateVertexBuffer(size, vertexType = VertexType.VERTEX_PCU)
    {
        const vertexBuffer = new VertexBuffer(size);
        if (vertexType === VertexType.VERTEX_PCU)
        {
            vertexBuffer.m_stride = Vertex_PCU.NUM_FLOAT32_ELEMENTS;
        }
        else if (vertexType === VertexType.VERTEX_PCUTBN)
        {
            vertexBuffer.m_stride = Vertex_PCUTBN.NUM_FLOAT32_ELEMENTS;
        }

        vertexBuffer.m_buffer = this.m_context.createBuffer();
        return vertexBuffer;
    }

    CopyVertexBufferToGPU(data, numVertexes, vbo)
    {
        vbo.m_size = numVertexes * vbo.m_stride * 4;
        const numDataElements = vbo.m_size / 4;

        // Convert JS number elements to Float32 elements
        const cpuData = new Float32Array(numDataElements);
        for (let vertexIndex = 0; vertexIndex < numVertexes; vertexIndex++)
        {
            cpuData[vertexIndex * vbo.m_stride] = data[vertexIndex].m_position.x;
            cpuData[vertexIndex * vbo.m_stride + 1] = data[vertexIndex].m_position.y;
            cpuData[vertexIndex * vbo.m_stride + 2] = data[vertexIndex].m_position.z;

            const colorAsFloats = data[vertexIndex].m_color.GetAsFloats();
            cpuData[vertexIndex * vbo.m_stride + 3] = colorAsFloats[0];
            cpuData[vertexIndex * vbo.m_stride + 4] = colorAsFloats[1];
            cpuData[vertexIndex * vbo.m_stride + 5] = colorAsFloats[2];
            cpuData[vertexIndex * vbo.m_stride + 6] = colorAsFloats[3];

            cpuData[vertexIndex * vbo.m_stride + 7] = data[vertexIndex].m_uvTexCoords.x;
            cpuData[vertexIndex * vbo.m_stride + 8] = data[vertexIndex].m_uvTexCoords.y;
        }

        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.bufferData(this.m_context.ARRAY_BUFFER, cpuData, this.m_context.DYNAMIC_DRAW);
    }

    BindVertexBuffer(vbo)
    {
        const vertexPositionAttributeLocation = this.m_context.getAttribLocation(this.m_webglProgram, "vertexPosition");
        if (vertexPositionAttributeLocation < 0)
        {
            console.error("Failed to get attribute for vertexPosition. Please create a \"vertexPosition\" attribute in your shader!");
        }
        this.m_context.enableVertexAttribArray(vertexPositionAttributeLocation);
        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.vertexAttribPointer(vertexPositionAttributeLocation, 3, this.m_context.FLOAT, false, vbo.m_stride * 4, 0);

        const vertexColorAttributeLocation = this.m_context.getAttribLocation(this.m_webglProgram, "vertexColor");
        if (vertexColorAttributeLocation < 0)
        {
            console.error("Failed to get attribute for vertexColor. Please create a \"vertexColor\" attribute in your shader!");
        }
        this.m_context.enableVertexAttribArray(vertexColorAttributeLocation);
        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.vertexAttribPointer(vertexColorAttributeLocation, 4, this.m_context.FLOAT, false, vbo.m_stride * 4, 12);

        const vertexUVAttributeLocation = this.m_context.getAttribLocation(this.m_webglProgram, "vertexUV");
        if (vertexUVAttributeLocation < 0)
        {
            console.error("Failed to get attribute for vertexUV. Please create a \"vertexUV\" attribute in your shader!");
        }
        this.m_context.enableVertexAttribArray(vertexUVAttributeLocation);
        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.vertexAttribPointer(vertexUVAttributeLocation, 2, this.m_context.FLOAT, false, vbo.m_stride * 4, 28);
    }

    CreateUniformBuffer(size)
    {

    }

    CopyUniformBufferToGPU()
    {

    }
}
