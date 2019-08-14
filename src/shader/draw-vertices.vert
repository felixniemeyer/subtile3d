#version 300 es

layout (location = 0) in uint vert; 

//uniforms...

uniform sampler2D verticesTexture;
uniform int quadCountSqrt; 
uniform int vertexCountSqrt; 
uniform float quadCountSqrtInverse;
uniform float vertexCountSqrtInverse;
uniform mat4 camera; 

out vec3 edgeDistances;
out float z;
out vec3 normal; 

void main() {
	// Camera.. alles! 
	vec2 edge[3];
	vec4 vertex[3];
	
	int quadId = gl_VertexID / 6;
	int edgeId = gl_VertexID - quadId * 6;

	int triangleEdgeId = edgeId > 2 ? edgeId - 3 : edgeId; 

	int y = quadId / quadCountSqrt;
	int x = quadId - y * quadCountSqrt; 

	// 0--1
	// | / 3
	// |/ /|
	// 2 / |
	//  5--4
	if(edgeId == 0) {
		edge[0] = vec2(0, 0);
		edge[1] = vec2(1, 0);
		edge[2] = vec2(0, 1);
	} else if (edgeId == 1) {
		edge[0] = vec2(1, 0);
		edge[1] = vec2(0, 1);
		edge[2] = vec2(0, 0); 
	} else if (edgeId == 2) {
		edge[0] = vec2(0, 1);
		edge[1] = vec2(0, 0);
		edge[2] = vec2(1, 0); 
	} else if (edgeId == 3) {
		edge[0] = vec2(1, 0);
		edge[1] = vec2(1, 1);
		edge[2] = vec2(0, 1);
	} else if (edgeId == 4) {
		edge[0] = vec2(1, 1);
		edge[1] = vec2(0, 1);
		edge[2] = vec2(1, 0);
	} else if (edgeId == 5) {
		edge[0] = vec2(0, 1);
		edge[1] = vec2(1, 0);
		edge[2] = vec2(1, 1);
	}

	vec3 coords[3]; 
	for(int i = 0; i < 3; i++) {
		// edge[i] *= 0.9; //debug
		edge[i] = edge[i] + vec2(float(x), float(y));
		vertex[i] = texture(verticesTexture, edge[i] * vertexCountSqrtInverse);
		coords[i] = vec3(edge[i], 0) * quadCountSqrtInverse * 2.0 - vec3(1,1,0)
			+ (vertex[i].xyz - vec3(0.5,0.5,0.5)) * 4.0 * quadCountSqrtInverse;
	}

	normal = normalize( cross(
				coords[1].xyz - coords[0].xyz,
				coords[2].xyz - coords[0].xyz
				)
			);

	
	// TODO: transform everything
	// DAAAAMN: transformation etc needs to move either in the noise texture calculation
	// Or in a step between: from the noise to the coordinates incl. transformation
	// 
	// Damnit
	
	for(int i = 0; i < 3; i++) {
		vec4 transformed = camera * vec4(coords[i], 1);
		coords[i] = transformed.xyz;
		coords[i].x /= ( -coords[i].z + 1.0 ) * 1.2;
		coords[i].y /= ( -coords[i].z + 1.0 ) * 0.5;
	}
	
	gl_Position = vec4(coords[0], 1);

	edgeDistances = vec3(0,0,0);
	vec2 n = normalize(vertex[2].xy - vertex[1].xy);
	vec2 h = vertex[1].xy - vertex[0].xy;
	edgeDistances[triangleEdgeId] = length(h - dot(h, n) * n);

	z = vertex[0].z;
}
