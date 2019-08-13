#version 300 es 

precision mediump float;

in vec3 edgeDistances; 
in float z; 
in vec3 normal; 

out vec4 fragColor; 

void main() {
	fragColor = vec4(normal, 1); 
}
