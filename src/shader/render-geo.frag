#version 300 es 

precision mediump float;

const vec3 baseColor = vec3(0.4, 0.0, 0.1);

uniform float pixelSize; 
uniform float progress; 
uniform float border; 
uniform float fog; 

in vec3 edgeDistances; 
in float z; 
in vec3 normal; 

out vec4 fragColor; 

void main() {
	vec3 col = baseColor + 0.2 * (normal);

	float border = 0.045 - 0.072 * border - 0.091 * z; 
	float edgeDistance = min(min(edgeDistances.x, edgeDistances.y), edgeDistances.z);


	float opacity = ( z + 1.85 - fog ) 
		* smoothstep(border, border - 2.0 * pixelSize, edgeDistance);

	// col = pow(col, vec3(0.4545));

	fragColor = vec4(col, opacity);
}
