#version 300 es 

precision mediump float;

const vec3 baseColor = vec3(0.4, 0.0, 0.1);

uniform float pixelSize; 
uniform float resolution; 
uniform float progress; 

in vec3 edgeDistances; 
in float z; 
in vec3 normal; 

out vec4 fragColor; 

void main() {
	vec3 col = baseColor + normal;

	float border = 0.1 - 0.068 * progress - 0.051 * z; //( thickness - 10.0 * z ) * pixelSize; 
	float edgeDistance = min(min(edgeDistances.x, edgeDistances.y), edgeDistances.z);

	col = pow(col, vec3(0.4545));

	float opacity = ( z + 0.65 + progress * 0.3 ) * smoothstep(border, border - 2.0 * pixelSize, edgeDistance); 

	fragColor = vec4(col, opacity);
}
