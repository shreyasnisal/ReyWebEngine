"use strict";


export const defaultVertexShader =
`#version 300 es
    
    layout(std140) uniform CameraConstants
    {
        mat4 viewMatrix;
        mat4 projectionMatrix;
    };
    
    layout(std140) uniform ModelConstants
    {
        mat4 modelMatrix;
        vec4 modelColor;
    };

    in vec3 in_vertexPosition;
    in vec4 in_vertexColor;
    in vec2 in_vertexUV;

    out vec4 v2f_vertexColor;
    out vec2 v2f_vertexUV;
    
    void main(void) {
        vec4 localPosition = vec4(in_vertexPosition, 1.0);
        vec4 worldPosition = modelMatrix * localPosition;
        vec4 viewPosition = viewMatrix * worldPosition;
        vec4 clipPosition = projectionMatrix * viewPosition;
        
        gl_Position = clipPosition;
        v2f_vertexColor = in_vertexColor * modelColor;
        v2f_vertexUV = in_vertexUV;
    }
`;

export const defaultFragmentShader =
`#version 300 es
    
    precision mediump float;
    
    uniform sampler2D diffuseSampler;
    
    in vec4 v2f_vertexColor;
    in vec2 v2f_vertexUV;
    
    out vec4 fragColor;

    void main(void) {
        vec4 diffuseColor = texture(diffuseSampler, v2f_vertexUV);
    
        fragColor = v2f_vertexColor * diffuseColor;
    }
`;
