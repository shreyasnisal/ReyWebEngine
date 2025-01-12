"use strict";

import {g_webXR} from "/Engine/Core/EngineCommon.js";
import * as FileUtils from "/Engine/Core/FileUtils.js";
import * as MathUtils from "/Engine/Math/MathUtils.js"
import Rgba8 from "/Engine/Core/Rgba8.js";
import Vertex_PCU from "/Engine/Core/Vertex_PCU.js";
import Vertex_PCUTBN from "/Engine/Core/Vertex_PCUTBN.js";

import Mat44 from "/Engine/Math/Mat44.js"
import Vec2 from "/Engine/Math/Vec2.js"
import BitmapFont from "/Engine/Renderer/BitmapFont.js";

import { defaultVertexShader, defaultFragmentShader } from "/Engine/Renderer/DefaultShader.js";
import Shader from "/Engine/Renderer/Shader.js";
import Texture from "/Engine/Renderer/Texture.js";
import UniformBuffer from "/Engine/Renderer/UniformBuffer.js";
import VertexBuffer from "/Engine/Renderer/VertexBuffer.js";


export let g_viewportWidth = window.innerWidth;
export let g_viewportHeight = window.innerHeight;
export let g_aspect = g_viewportWidth / g_viewportHeight;

const FLOAT32_SIZE = 4;

const CAMERA_CONSTANTS_NUM_ELEMENTS = 32;
const SHADER_CAMERA_CONSTANTS_BIND_SLOT = 0;

const MODEL_CONSTANTS_NUM_ELEMENTS = 20;
const SHADER_MODEL_CONSTANTS_BIND_SLOT = 1;

const LIGHT_CONSTANTS_NUM_ELEMENTS = 8;
const SHADER_LIGHT_CONSTANTS_BIND_SLOT = 2;

export class VertexType
{
    static VERTEX_PCU = "VERTEX_PCU";
    static VERTEX_PCUTBN = "Vertex_PCUTBN";
}

export class BlendMode
{
    static ALPHA = "ALPHA";
    static ADDITIVE = "ADDITIVE";
    static OPAQUE = "OPAQUE";
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
        this.m_isConstructed = false;

        const canvas = document.getElementById("id_canvas");
        canvas.width = g_viewportWidth;
        canvas.height = g_viewportHeight;
        this.m_context = canvas.getContext("webgl2", { xrCompatible: true, antialias: true });
        if (!this.m_context)
        {
            console.error("webgl2 is not supported");
            return;
        }
        window.addEventListener("resize", this.HandleWindowResize);

        // Initialize variables
        this.m_loadedTextures = [];
        this.m_loadedFonts = [];
        this.m_loadedShaders = [];

        this.m_currentBlendMode = null;
        this.m_desiredBlendMode = BlendMode.ALPHA;
        this.m_currentCullMode = null;
        this.m_desiredCullMode = CullMode.BACK;
        this.m_currentDepthMode = null;
        this.m_desiredDepthMode = DepthMode.ENABLED;

        this.m_currentShader = null;
        this.m_defaultShader = null;

        this.m_currentEye = "none";

        this.m_isConstructed = true;
    }

    Startup()
    {
        this.m_defaultShader = this.CreateShaderFromSource("DefaultShader", defaultVertexShader, defaultFragmentShader);
        this.BindShader(this.m_defaultShader);

        // Create an immediate vertex buffer to copy data into when passing vertexes
        this.m_immediateVBO = this.CreateVertexBuffer(Vertex_PCU.NUM_FLOAT32_ELEMENTS * FLOAT32_SIZE);
        // Create a uniform buffer to bind camera constants
        this.m_cameraUBO = this.CreateUniformBuffer(CAMERA_CONSTANTS_NUM_ELEMENTS * FLOAT32_SIZE);
        // Create a uniform buffer to bind model constants
        this.m_modelUBO = this.CreateUniformBuffer(MODEL_CONSTANTS_NUM_ELEMENTS * FLOAT32_SIZE);
        // Create a uniform buffer to bind light constants
        this.m_lightUBO = this.CreateUniformBuffer(LIGHT_CONSTANTS_NUM_ELEMENTS * FLOAT32_SIZE);

        // Create a default texture, a 1x1 white pixel
        this.m_defaultTexture = this.CreateTextureFromData("defaultTexture", 1, 1, new Uint8Array([255, 255, 255, 255]));

        // Enable depth testing
        // Changing depth mode between enabled and disabled is just changing the depth function
        this.m_context.enable(this.m_context.DEPTH_TEST);

        // Enable blending
        // Changing blend mode is just changing the blend function
        this.m_context.enable(this.m_context.BLEND);
    }

    BeginFrame()
    {
        if (!g_webXR.m_initialized)
        {
            this.m_context.bindFramebuffer(this.m_context.FRAMEBUFFER, null);
        }
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
        g_aspect = g_viewportWidth / g_viewportHeight;
        const canvas = document.getElementById("id_canvas");
        canvas.width = g_viewportWidth;
        canvas.height = g_viewportHeight;
    }

    BeginCamera(camera)
    {
        this.m_camera = camera;

        if (this.m_currentEye === "none" || !g_webXR.m_initialized)
        {
            this.m_context.viewport(0, 0, g_viewportWidth, g_viewportHeight);
        }
        else
        {
            const viewportXYAndDimensions = g_webXR.GetViewportForEye(this.m_currentEye);
            this.m_context.viewport(viewportXYAndDimensions[0].x, viewportXYAndDimensions[0].y, viewportXYAndDimensions[1].x, viewportXYAndDimensions[1].y);
        }

        const viewMatrixValues = camera.GetViewMatrix().m_values;
        const projectionMatrixValues = camera.GetProjectionMatrix().m_values;

        this.CopyUniformBufferToGPU([...viewMatrixValues, ...projectionMatrixValues], CAMERA_CONSTANTS_NUM_ELEMENTS, this.m_cameraUBO);
        this.BindUniformBuffer(this.m_cameraUBO, SHADER_CAMERA_CONSTANTS_BIND_SLOT, "CameraConstants");
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
        // this.m_immediateVBO.m_stride = Vertex_PCU.NUM_FLOAT32_ELEMENTS;
        this.CopyVertexBufferToGPU(vertexes, vertexes.length, this.m_immediateVBO);
        this.DrawVertexBuffer(this.m_immediateVBO, vertexes.length);
    }

    DrawVertexBuffer(vbo, numVertexes)
    {
        this.SetStatesIfChanged();
        this.BindVertexBuffer(vbo);
        this.m_context.drawArrays(this.m_context.TRIANGLES, 0, numVertexes);
    }

    SetModelConstants(modelMatrix = Mat44.IDENTITY, modelColor = Rgba8.WHITE)
    {
        const modelMatrixValues = modelMatrix.m_values;
        const modelColorAsFloats = modelColor.GetAsFloats();
        this.CopyUniformBufferToGPU([...modelMatrixValues, ...modelColorAsFloats], MODEL_CONSTANTS_NUM_ELEMENTS, this.m_modelUBO);
        this.BindUniformBuffer(this.m_modelUBO, SHADER_MODEL_CONSTANTS_BIND_SLOT, "ModelConstants");
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

            if (vbo.m_stride === Vertex_PCU.NUM_FLOAT32_ELEMENTS)
            {
                continue;
            }

            float32Data[vertexIndex * vbo.m_stride + 9] = data[vertexIndex].m_tangent.x;
            float32Data[vertexIndex * vbo.m_stride + 10] = data[vertexIndex].m_tangent.y;
            float32Data[vertexIndex * vbo.m_stride + 11] = data[vertexIndex].m_tangent.z;

            float32Data[vertexIndex * vbo.m_stride + 12] = data[vertexIndex].m_bitangent.x;
            float32Data[vertexIndex * vbo.m_stride + 13] = data[vertexIndex].m_bitangent.y;
            float32Data[vertexIndex * vbo.m_stride + 14] = data[vertexIndex].m_bitangent.z;

            float32Data[vertexIndex * vbo.m_stride + 15] = data[vertexIndex].m_normal.x;
            float32Data[vertexIndex * vbo.m_stride + 16] = data[vertexIndex].m_normal.y;
            float32Data[vertexIndex * vbo.m_stride + 17] = data[vertexIndex].m_normal.z;
        }

        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.bufferData(this.m_context.ARRAY_BUFFER, float32Data, this.m_context.DYNAMIC_DRAW);
    }

    BindVertexBuffer(vbo)
    {
        const vertexPositionAttributeLocation = this.m_context.getAttribLocation(this.m_currentShader.m_program, "in_vertexPosition");
        if (vertexPositionAttributeLocation < 0)
        {
            // console.error("Failed to get attribute for vertexPosition. Please create a \"in_vertexPosition\" attribute in your shader!");
        }
        this.m_context.enableVertexAttribArray(vertexPositionAttributeLocation);
        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.vertexAttribPointer(vertexPositionAttributeLocation, 3, this.m_context.FLOAT, false, vbo.m_stride * 4, 0);

        const vertexColorAttributeLocation = this.m_context.getAttribLocation(this.m_currentShader.m_program, "in_vertexColor");
        if (vertexColorAttributeLocation < 0)
        {
            // console.error("Failed to get attribute for vertexColor. Please create a \"in_vertexColor\" attribute in your shader!");
        }
        this.m_context.enableVertexAttribArray(vertexColorAttributeLocation);
        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.vertexAttribPointer(vertexColorAttributeLocation, 4, this.m_context.FLOAT, false, vbo.m_stride * 4, 12);

        const vertexUVAttributeLocation = this.m_context.getAttribLocation(this.m_currentShader.m_program, "in_vertexUV");
        if (vertexUVAttributeLocation < 0)
        {
            // console.error("Failed to get attribute for vertexUV. Please create a \"in_vertexUV\" attribute in your shader!");
        }
        this.m_context.enableVertexAttribArray(vertexUVAttributeLocation);
        this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
        this.m_context.vertexAttribPointer(vertexUVAttributeLocation, 2, this.m_context.FLOAT, false, vbo.m_stride * 4, 28);

        if (this.m_currentShader.m_vertexType === VertexType.VERTEX_PCU)
        {
            return;
        }

        const vertexTangentAttributeLocation = this.m_context.getAttribLocation(this.m_currentShader.m_program, "in_vertexTangent");
        if (vertexTangentAttributeLocation >= 0)
        {
            this.m_context.enableVertexAttribArray(vertexTangentAttributeLocation);
            this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
            this.m_context.vertexAttribPointer(vertexTangentAttributeLocation, 3, this.m_context.FLOAT, false, vbo.m_stride * 4, 36);
        }

        const vertexBitangentAttributeLocation = this.m_context.getAttribLocation(this.m_currentShader.m_program, "in_vertexBitangent");
        if (vertexBitangentAttributeLocation >= 0)
        {
            this.m_context.enableVertexAttribArray(vertexBitangentAttributeLocation);
            this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
            this.m_context.vertexAttribPointer(vertexBitangentAttributeLocation, 3, this.m_context.FLOAT, false, vbo.m_stride * 4, 48);
        }

        const vertexNormalAttributeLocation = this.m_context.getAttribLocation(this.m_currentShader.m_program, "in_vertexNormal");
        if (vertexNormalAttributeLocation >= 0)
        {
            this.m_context.enableVertexAttribArray(vertexNormalAttributeLocation);
            this.m_context.bindBuffer(this.m_context.ARRAY_BUFFER, vbo.m_buffer);
            this.m_context.vertexAttribPointer(vertexNormalAttributeLocation, 3, this.m_context.FLOAT, false, vbo.m_stride * 4, 60);
        }
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
        this.m_context.bufferData(this.m_context.UNIFORM_BUFFER, numElements * FLOAT32_SIZE, this.m_context.DYNAMIC_DRAW);
        this.m_context.bufferSubData(this.m_context.UNIFORM_BUFFER, 0, float32Data);
        this.m_context.bindBuffer(this.m_context.UNIFORM_BUFFER, null);
    }

    BindUniformBuffer(ubo, slot, shaderBufferName)
    {
        this.m_context.uniformBlockBinding(this.m_currentShader.m_program, this.m_context.getUniformBlockIndex(this.m_currentShader.m_program, shaderBufferName), slot);
        this.m_context.bindBufferBase(this.m_context.UNIFORM_BUFFER, slot, ubo.m_buffer);
    }

    SetCullMode(cullMode)
    {
        this.m_desiredCullMode = cullMode;
    }

    SetDepthMode(depthMode)
    {
        this.m_desiredDepthMode = depthMode;
    }

    SetBlendMode(blendMode)
    {
        this.m_desiredBlendMode = blendMode;
    }

    SetStatesIfChanged()
    {
        // Set Blend mode if changed
        this.SetBlendModeIfChanged();

        // Set Cull mode if changed
        this.SetCullModeIfChanged();

        // Set Depth mode if changed
        this.SetDepthModeIfChanged();
    }

    SetBlendModeIfChanged()
    {
        if (this.m_currentBlendMode === this.m_desiredBlendMode)
        {
            return;
        }

        if (this.m_desiredBlendMode === BlendMode.ALPHA)
        {
            this.m_context.blendFunc(this.m_context.SRC_ALPHA, this.m_context.ONE_MINUS_SRC_ALPHA);
        }
        else if (this.m_desiredBlendMode === BlendMode.ADDITIVE)
        {
            this.m_context.blendFunc(this.m_context.ONE, this.m_context.ONE);
        }
        else if (this.m_desiredBlendMode === BlendMode.OPAQUE)
        {
            this.m_context.blendFunc(this.m_context.ONE, this.m_context.ZERO);
        }

        this.m_currentBlendMode = this.m_desiredBlendMode;
    }

    SetCullModeIfChanged()
    {
        if (this.m_currentCullMode === this.m_desiredCullMode)
        {
            return;
        }

        if (this.m_desiredCullMode === CullMode.NONE)
        {
            this.m_context.disable(this.m_context.CULL_FACE);
        }
        else if (this.m_desiredCullMode === CullMode.BACK)
        {
            this.m_context.enable(this.m_context.CULL_FACE);
            this.m_context.cullFace(this.m_context.BACK);
        }
        else if (this.m_desiredCullMode === CullMode.FRONT)
        {
            this.m_context.enable(this.m_context.CULL_FACE);
            this.m_context.cullFace(this.m_context.FRONT);
        }

        this.m_currentCullMode = this.m_desiredCullMode;
    }

    SetDepthModeIfChanged()
    {
        if (this.m_currentDepthMode === this.m_desiredDepthMode)
        {
            return;
        }

        if (this.m_desiredDepthMode === DepthMode.ENABLED)
        {
            this.m_context.depthFunc(this.m_context.LEQUAL);
        }
        else if (this.m_desiredDepthMode === DepthMode.DISABLED)
        {
            this.m_context.depthFunc(this.m_context.ALWAYS);
        }

        this.m_currentDepthMode = this.m_desiredDepthMode;
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

    UpdateTextureFromData(texture, data)
    {
        this.m_context.bindTexture(this.m_context.TEXTURE_2D, texture.m_texture);
        this.m_context.texImage2D(this.m_context.TEXTURE_2D, 0, this.m_context.RGBA, texture.m_dimensions.x, texture.m_dimensions.y, 0, this.m_context.RGBA, this.m_context.UNSIGNED_BYTE, data);
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

    async CreateOrGetBitmapFont(bitmapFontFilePathWithNoExtension)
    {
        const existingFont = this.GetBitmapFontFromFileName(bitmapFontFilePathWithNoExtension);
        if (existingFont != null)
        {
            return existingFont;
        }

        return await this.CreateBitmapFontFromFile(bitmapFontFilePathWithNoExtension);
    }

    GetBitmapFontFromFileName(bitmapFontName)
    {
        for (let fontIndex = 0; fontIndex < this.m_loadedFonts.length; fontIndex++)
        {
            if (this.m_loadedFonts[fontIndex].m_fontFilePathWithNoExtension === bitmapFontName)
            {
                return this.m_loadedFonts[fontIndex];
            }
        }

        return null;
    }

    CreateBitmapFontFromFile(bitmapFontFilePathWithNoExtension)
    {
        let bitmapFontName = bitmapFontFilePathWithNoExtension;
        bitmapFontName += ".png";

        return new Promise(resolve =>
        {
            this.CreateOrGetTextureFromFile(bitmapFontName).then(texture =>
            {
                const newFont = new BitmapFont(bitmapFontFilePathWithNoExtension, texture);
                this.m_loadedFonts.push(newFont);
                resolve(newFont);
            })
        });
    }

    async CreateOrGetShaderFromFiles(shaderName, vertexShaderFilePathWithNoExtension, fragmentShaderFilePathWithNoExtension, vertexType = VertexType.VERTEX_PCU)
    {
        const existingShader = this.GetShaderFromName(shaderName);
        if (existingShader)
        {
            return existingShader;
        }

        return await this.CreateShaderFromFiles(shaderName, vertexShaderFilePathWithNoExtension, fragmentShaderFilePathWithNoExtension, vertexType);
    }

    GetShaderFromName(shaderName)
    {
        for (let shaderIndex = 0; shaderIndex < this.m_loadedShaders.length; shaderIndex++)
        {
            if (this.m_loadedShaders[shaderIndex].m_name === shaderName)
            {
                return this.m_loadedShaders[shaderIndex];
            }
        }

        return null;
    }

    async CreateShaderFromFiles(shaderName, vertexShaderFilePathWithNoExtension, fragmentShaderFilePathWithNoExtension, vertexType = VertexType.VERTEX_PCU)
    {
        const vertexShaderSource = await FileUtils.ReadToString(vertexShaderFilePathWithNoExtension + ".glsl");
        const fragmentShaderSource = await FileUtils.ReadToString(fragmentShaderFilePathWithNoExtension + ".glsl");
        return this.CreateShaderFromSource(shaderName, vertexShaderSource, fragmentShaderSource, vertexType);
    }

    CreateShaderFromSource(shaderName, vertexShaderSource, fragmentShaderSource, vertexType = VertexType.VERTEX_PCU)
    {
        const newShader = new Shader(shaderName);
        newShader.m_vertexType = vertexType;
        newShader.m_program = this.m_context.createProgram();

        // Create, compile and attach vertex shader to the WebGL program
        newShader.m_vertexShader = this.m_context.createShader(this.m_context.VERTEX_SHADER);
        this.m_context.shaderSource(newShader.m_vertexShader, vertexShaderSource);
        this.m_context.compileShader(newShader.m_vertexShader);
        if (!this.m_context.getShaderParameter(newShader.m_vertexShader, this.m_context.COMPILE_STATUS))
        {
            const compileError = this.m_context.getShaderInfoLog(newShader.m_vertexShader);
            console.error(compileError);
        }
        this.m_context.attachShader(newShader.m_program, newShader.m_vertexShader);

        // Create, compile and attach fragment shader to the WebGL program
        newShader.m_fragmentShader = this.m_context.createShader(this.m_context.FRAGMENT_SHADER);
        this.m_context.shaderSource(newShader.m_fragmentShader, fragmentShaderSource);
        this.m_context.compileShader(newShader.m_fragmentShader);
        if (!this.m_context.getShaderParameter(newShader.m_fragmentShader, this.m_context.COMPILE_STATUS))
        {
            const compileError = this.m_context.getShaderInfoLog(newShader.m_fragmentShader);
            console.error(compileError);
        }
        this.m_context.attachShader(newShader.m_program, newShader.m_fragmentShader);

        // Link the program
        this.m_context.linkProgram(newShader.m_program);
        if (!this.m_context.getProgramParameter(newShader.m_program, this.m_context.LINK_STATUS))
        {
            const linkError = this.m_context.getProgramInfoLog(newShader.m_program);
            console.error(linkError);
        }

        this.m_loadedShaders.push(newShader);
        return newShader;
    }

    BindShader(shaderToBind = null)
    {
        if (shaderToBind == null)
        {
            this.m_context.useProgram(this.m_defaultShader.m_program);
            this.m_currentShader = this.m_defaultShader;
        }
        else
        {
            this.m_context.useProgram(shaderToBind.m_program);
            this.m_currentShader = shaderToBind;
        }
    }

    SetLightConstants(sunDirection, sunIntensity, ambientIntensity)
    {
        this.CopyUniformBufferToGPU([sunDirection.x, sunDirection.y, sunDirection.z, 0.0, sunIntensity, ambientIntensity, 0.0, 0.0], LIGHT_CONSTANTS_NUM_ELEMENTS, this.m_lightUBO);
        this.BindUniformBuffer(this.m_lightUBO, SHADER_LIGHT_CONSTANTS_BIND_SLOT, "LightConstants");
    }

    SetFrameBuffer(frameBuffer = null)
    {
        this.m_context.bindFramebuffer(this.m_context.FRAMEBUFFER, frameBuffer);
    }

    SetVREye(eye)
    {
        this.m_currentEye = eye;
    }

    BeginRenderForVR()
    {
        if (!g_webXR.m_initialized)
        {
            return;
        }

        const frameBuffer = g_webXR.GetFrameBuffer();
        this.m_context.bindFramebuffer(this.m_context.FRAMEBUFFER, frameBuffer);
    }
}
