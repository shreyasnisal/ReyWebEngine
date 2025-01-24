#version 300 es
    
precision mediump float;

uniform sampler2D diffuseSampler;

in vec4 v2f_vertexColor;
in vec2 v2f_vertexUV;
in vec3 v2f_vertexTangent;
in vec3 v2f_vertexBitangent;
in vec3 v2f_vertexNormal;
in vec3 v2f_lightDirection;
in float v2f_lightIntensity;
in float v2f_ambientIntensity;

out vec4 fragColor;

void main(void) {
	
	float ambient = v2f_ambientIntensity;
	float directional = v2f_lightIntensity * clamp(dot(normalize(v2f_vertexNormal.xyz), -v2f_lightDirection), 0.0, 1.0);
	vec4 lightColor = vec4(ambient + directional, ambient + directional, ambient + directional, 1.0);

	vec4 textureColor = texture(diffuseSampler, v2f_vertexUV);

	fragColor = lightColor * textureColor * v2f_vertexColor;
}