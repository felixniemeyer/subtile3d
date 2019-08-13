#version 300 es

layout (location = 0) in vec2 vert; 

//uniforms...

uniform sampler2D verticesTexture;

out vec3 edgeDistances;
out float z;
out vec3 normal; 

void main() {
	// Camera.. alles! 
	
	edgeDistances = vec3(0,0,1);
	z = 1.0;
	normal = vec3(0,0,-1);
}
