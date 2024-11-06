export const defaultVertexShader =
`#version 300 es
    
    uniform CameraConstants
    {
        mat4 viewMatrix;
        mat4 projectionMatrix;
    };
    
    uniform ModelConstants
    {
        mat4 modelMatrix;
        vec4 modelColor;
    };

    in vec3 vertexPosition;
    in vec4 vertexColor;
    in vec2 vertexUV;

    out vec4 vColor;
    out vec2 vUV;
    
    void main(void) {
        vec4 localPosition = vec4(vertexPosition, 1.0);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * localPosition;
        vColor = vertexColor * modelColor;
        vUV = vertexUV;
    }
`;

export const defaultFragmentShader =
`#version 300 es
    
    precision mediump float;
    
    in vec4 vColor;
    in vec2 vUV;
    
    out vec4 fragColor;

    void main(void) {
        fragColor = vColor;
    }
`;