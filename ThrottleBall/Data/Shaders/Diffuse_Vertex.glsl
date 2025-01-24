#version 300 es
    
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

layout(std140) uniform LightConstants
{
	vec3 uSunDirection;
	float padding0;
	float uSunIntensity;
	float uAmbientIntensity;
	float padding1;
	float padding2;
};

layout(location = 0) in vec3 in_vertexPosition;
layout(location = 1) in vec4 in_vertexColor;
layout(location = 2) in vec2 in_vertexUV;
layout(location = 3) in vec3 in_vertexTangent;
layout(location = 4) in vec3 in_vertexBitangent;
layout(location = 5) in vec3 in_vertexNormal;

out vec4 v2f_vertexColor;
out vec2 v2f_vertexUV;
out vec3 v2f_vertexTangent;
out vec3 v2f_vertexBitangent;
out vec3 v2f_vertexNormal;
out vec3 v2f_lightDirection;
out float v2f_lightIntensity;
out float v2f_ambientIntensity;

void main(void) {
	vec4 localPosition = vec4(in_vertexPosition, 1.0);
	vec4 worldPosition = modelMatrix * localPosition;
	vec4 viewPosition = viewMatrix * worldPosition;
	vec4 clipPosition = projectionMatrix * viewPosition;
	
	gl_Position = clipPosition;
	v2f_vertexColor = in_vertexColor * modelColor;
	v2f_vertexUV = in_vertexUV;
	v2f_vertexTangent = in_vertexTangent;
	v2f_vertexBitangent = in_vertexBitangent;
	v2f_vertexNormal = in_vertexNormal;
	v2f_lightDirection = uSunDirection;
	v2f_lightIntensity = uSunIntensity;
	v2f_ambientIntensity = uAmbientIntensity;
}
