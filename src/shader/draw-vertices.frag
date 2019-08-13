#version 300 es 

precision mediump float;

const vec3 baseColor = vec3(0.1, 0.0, 0.1);

in vec3 edgeDistances; 
in float z; 
in vec3 normal; 

out vec4 fragColor; 

void main() {
	vec3 col = baseColor + normal;

	//col = pow(col, vec3(0.4545));
	fragColor = vec4(col, 1);
	
}
