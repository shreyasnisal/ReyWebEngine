import * as MathUtils from "../../Engine/Math/MathUtils.js"
import { defaultVertexShader, defaultFragmentShader } from "../../Engine/Renderer/DefaultShader.js";
import Rgba8 from "../../Engine/Core/Rgba8.js";
import Vertex_PCU from "../../Engine/Core/Vertex_PCU.js";
import Vertex_PCUTBN from "../../Engine/Core/Vertex_PCUTBN.js";
import Mat44 from "../../Engine/Math/Mat44.js"
import Vec2 from "../../Engine/Math/Vec2.js"
import Texture from "../../Engine/Renderer/Texture.js";
import UniformBuffer from "../../Engine/Renderer/UniformBuffer.js";
import VertexBuffer from "../../Engine/Renderer/VertexBuffer.js";

export let g_viewportWidth = window.innerWidth;
export let g_viewportHeight = window.innerHeight;

const FLOAT32_SIZE = 4;

const CAMERA_CONSTANTS_NUM_ELEMENTS = 32;
const SHADER_CAMERA_CONSTANTS_BIND_SLOT = 2;

const MODEL_CONSTANTS_NUM_ELEMENTS = 20;
const SHADER_MODEL_CONSTANTS_BIND_SLOT = 3;

export class VertexType
{
    static VERTEX_PCU = "VERTEX_PCU";
    static VERTEX_PCUTBN = "Vertex_PCUTBN";
}

export class CullMode
{
    static BACK = "BACK";
    static FRONT = "FRONT";
    static NONE = "NONE";
}

export class DepthMode
{
    static ENABLED = "ENABLED";
    static DISABLED = "DISABLED";
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
        this.m_config = config;

        const canvas = document.getElementById("id_canvas");
        canvas.width = g_viewportWidth;
        canvas.height = g_viewportHeight;
        this.m_context = canvas.getContext("webgl2");
        if (!this.m_context)
        {
            console.error("webgl2 is not supported");
        }
        window.addEventListener("resize", this.HandleWindowResize);

        // Initialize variables
        this.m_loadedTextures = [];
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
        this.m_immediateVBO = this.CreateVertexBuffer(Vertex_PCU.NUM_FLOAT32_ELEMENTS * FLOAT32_SIZE);
        // Create a uniform buffer to bind camera constants
        this.m_cameraUBO = this.CreateUniformBuffer(CAMERA_CONSTANTS_NUM_ELEMENTS * FLOAT32_SIZE);
        // Create a uniform buffer to bind model constants
        this.m_modelUBO = this.CreateUniformBuffer(MODEL_CONSTANTS_NUM_ELEMENTS * FLOAT32_SIZE);

        // Create a default texture, a 1x1 white pixel
        this.m_defaultTexture = this.CreateTextureFromData("defaultTexture", 1, 1, new Uint8Array([255, 255, 255, 255]));

        // Set ALPHA blend mode
        // #ToDo Move to SetBlendMode method
        this.m_context.enable(this.m_context.BLEND);
        this.m_context.blendFunc(this.m_context.SRC_ALPHA, this.m_context.ONE_MINUS_SRC_ALPHA);

        // Set uniform block binding for CameraConstants and ModelConstants
        this.m_context.uniformBlockBinding(this.m_webglProgram, this.m_context.getUniformBlockIndex(this.m_webglProgram, "CameraConstants"), SHADER_CAMERA_CONSTANTS_BIND_SLOT);
        this.m_context.uniformBlockBinding(this.m_webglProgram, this.m_context.getUniformBlockIndex(this.m_webglProgram, "ModelConstants"), SHADER_MODEL_CONSTANTS_BIND_SLOT);
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

    HandleWindowResize()
    {
        g_viewportWidth = window.innerWidth;
        g_viewportHeight = window.innerHeight;
        const canvas = document.getElementById("id_canvas");
        canvas.width = g_viewportWidth;
        canvas.height = g_viewportHeight;
    }

    BeginCamera(camera)
    {
        this.m_camera = camera;

        this.m_context.viewport(0, 0, g_viewportWidth, g_viewportHeight);

        const viewMatrixValues = camera.GetViewMatrix().m_values;
        const projectionMatrixValues = camera.GetProjectionMatrix().m_values;

        this.CopyUniformBufferToGPU([...viewMatrixValues, ...projectionMatrixValues], CAMERA_CONSTANTS_NUM_ELEMENTS, this.m_cameraUBO);
        this.BindUniformBuffer(this.m_cameraUBO, SHADER_CAMERA_CONSTANTS_BIND_SLOT);
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
        const modelMatrixValues = modelMatrix.m_values;
        const modelColorAsFloats = modelColor.GetAsFloats();
        this.CopyUniformBufferToGPU([...modelMatrixValues, ...modelColorAsFloats], MODEL_CONSTANTS_NUM_ELEMENTS, this.m_modelUBO);
        this.BindUniformBuffer(this.m_modelUBO, SHADER_MODEL_CONSTANTS_BIND_SLOT);
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
        const float32Data = new Float32Array(numDataElements);
        for (let vertexIndex = 0; vertexIndex < numVertexes; vertexIndex++)
        {
            float32Data[vertexIndex * vbo.m_stride] = data[vertexIndex].m_position.x;
            float32Data[vertexIndex * vbo.m_stride + 1] = data[vertexIndex].m_position.y;
            float32Data[vertexIndex * vbo.m_stride + 2] = data[vertexIndex].m_position.z;

            const colorAsFloats = data[vertexIndex].m_color.GetAsFloats();
            float32Data[vertexIndex * vbo.m_stride + 3] = colorAsFloats[0];
            float32Data[vertexIndex * vbo.m_stride + 4] = colorAsFloats[1];
            float32Data[vertexIndex * vbo.m_stride + 5] = colorAsFloats[2];
            float32Data[vertexIndex * vbo.m_stride + 6] = colorAsFloats[3];

            float32Data[vertexIndex * vbo.m_stride + 7] = data[vertexIndex].m_uvTexCoords.x;
            float32Data[vertexIndex * vbo.m_stride + 8] = data[vertexIndex].m_uvTexCoords.y;
        }

        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.bufferData(this.m_context.ARRAY_BUFFER, float32Data, this.m_context.DYNAMIC_DRAW);
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
        const uniformBuffer = new UniformBuffer(size);
        uniformBuffer.m_buffer = this.m_context.createBuffer();
        return uniformBuffer;
    }

    CopyUniformBufferToGPU(data, numElements, ubo)
    {
        const float32Data = new Float32Array(numElements);
        for (let elemIndex = 0; elemIndex < numElements; elemIndex++)
        {
            float32Data[elemIndex] = data[elemIndex];
        }

        this.m_context.bindBuffer(this.m_context.UNIFORM_BUFFER, ubo.m_buffer);
        this.m_context.bufferData(this.m_context.UNIFORM_BUFFER, numElements * FLOAT32_SIZE, this.m_context.STATIC_READ);
        this.m_context.bufferSubData(this.m_context.UNIFORM_BUFFER, 0, float32Data);
    }

    BindUniformBuffer(ubo, slot)
    {
        this.m_context.bindBuffer(this.m_context.UNIFORM_BUFFER, ubo.m_buffer);
        this.m_context.bindBufferRange(this.m_context.UNIFORM_BUFFER, slot, ubo.m_buffer, 0, ubo.m_size);
    }

    SetCullMode(cullMode)
    {
        if (cullMode === CullMode.NONE)
        {
            this.m_context.disable(this.m_context.CULL_FACE);
        }
        else if (cullMode === CullMode.BACK)
        {
            this.m_context.enable(this.m_context.CULL_FACE);
            this.m_context.cullFace(this.m_context.BACK);
        }
        else if (cullMode === CullMode.FRONT)
        {
            this.m_context.enable(this.m_context.CULL_FACE);
            this.m_context.cullFace(this.m_context.FRONT);
        }
    }

    SetDepthMode(depthMode)
    {
        if (depthMode === DepthMode.ENABLED)
        {
            this.m_context.enable(this.m_context.DEPTH_TEST);
            this.m_context.depthFunc(this.m_context.LEQUAL);
        }
        else if (depthMode === DepthMode.DISABLED)
        {
            this.m_context.disable(this.m_context.DEPTH_TEST);
        }
    }

    async CreateOrGetTextureFromFile(filename)
    {
        const existingTexture = this.GetTextureFromFile(filename);
        if (existingTexture != null)
        {
            return existingTexture;
        }

        return await this.CreateTextureFromFile(filename);
    }

    GetTextureFromFile(filename)
    {
        for (let existingTextureIndex = 0; existingTextureIndex < this.m_loadedTextures.length; existingTextureIndex++)
        {
            if (this.m_loadedTextures[existingTextureIndex].m_name === filename)
            {
                return this.m_loadedTextures[existingTextureIndex];
            }
        }

        return null;
    }

    CreateTextureFromFile(filename)
    {
        return new Promise(resolve => {
            const imageDomElem = new Image();
            imageDomElem.addEventListener("load", () =>
            {
                this.m_context.pixelStorei(this.m_context.UNPACK_FLIP_Y_WEBGL, true);
                resolve(this.CreateTextureFromData(filename, imageDomElem.width, imageDomElem.height, imageDomElem));
            });
            imageDomElem.src = filename;
        });
    }

    CreateTextureFromData(textureName, textureWidth, textureHeight, data)
    {
        const newTexture = new Texture(textureName);
        newTexture.m_texture = this.m_context.createTexture();
        newTexture.m_dimensions = new Vec2(textureWidth, textureHeight);
        this.m_context.bindTexture(this.m_context.TEXTURE_2D, newTexture.m_texture);
        this.m_context.texImage2D(this.m_context.TEXTURE_2D, 0, this.m_context.RGBA, textureWidth, textureHeight, 0, this.m_context.RGBA, this.m_context.UNSIGNED_BYTE, data);

        this.m_loadedTextures.push(newTexture);

        return newTexture;
    }

    BindTexture(textureToBind = null)
    {
        if (textureToBind == null)
        {
            this.m_context.activeTexture(this.m_context.TEXTURE0);
            this.m_context.bindTexture(this.m_context.TEXTURE_2D, this.m_defaultTexture.m_texture);
        }
        else
        {
            this.m_context.activeTexture(this.m_context.TEXTURE0);
            this.m_context.bindTexture(this.m_context.TEXTURE_2D, textureToBind.m_texture);
        }
        this.m_context.texParameteri(this.m_context.TEXTURE_2D, this.m_context.TEXTURE_WRAP_S, this.m_context.CLAMP_TO_EDGE);
        this.m_context.texParameteri(this.m_context.TEXTURE_2D, this.m_context.TEXTURE_WRAP_T, this.m_context.CLAMP_TO_EDGE);
        this.m_context.texParameteri(this.m_context.TEXTURE_2D, this.m_context.TEXTURE_MIN_FILTER, this.m_context.LINEAR);
    }
}
