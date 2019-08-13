#version 300 es

layout (location = 0) in uint vert; 

//uniforms...

uniform sampler2D verticesTexture;
uniform int quadCountSqrt; 
uniform int vertexCountSqrt; 
uniform float quadCountSqrtInverse;
uniform float vertexCountSqrtInverse;

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

	int y = quadId / vertexCountSqrt;
	int x = quadId - y * vertexCountSqrt; 

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

	for(int i = 0; i < 3; i++) {
		// edge[i] *= 0.9; //debug
		edge[i] = edge[i] + vec2(float(x), float(y));
		vertex[i] = texture(verticesTexture, edge[i] * vertexCountSqrtInverse);
	}

	gl_Position = vec4(
			vec3(edge[0], 0) * vertexCountSqrtInverse * 2.0 - vec3(1,1,0)
			+ (vertex[0].xyz - vec3(0.5,0.5,0.5)) * 4.0 * quadCountSqrtInverse,
			1
		);

	normal = normalize( cross(
				vertex[1].xyz - vertex[0].xyz,
				vertex[2].xyz - vertex[0].xyz
				)
			);
	
	// TODO: transform everything

	edgeDistances = vec3(0,0,0);
	vec2 n = normalize(vertex[2].xy - vertex[1].xy);
	vec2 h = vertex[1].xy - vertex[0].xy;
	edgeDistances[triangleEdgeId] = length(h - dot(h, n) * n);

	/*/ debug stuff
	vec4 dp;
 	if(triangleEdgeId == 0) {
		dp = vec4(0,0,0,1);
	} else if (triangleEdgeId == 1) {
		dp = vec4(0,1,0,1);
	} else {
		dp = vec4(1,0,0,1);
	}
	float t = float(gl_VertexID) / 1024.0;
	*/
	//gl_Position = gl_Position * t + (1.0 -t) * dp;

	z = vertex[0].z;
}
