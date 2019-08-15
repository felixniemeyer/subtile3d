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

	vec3 v01 =coords[1].xyz - coords[0].xyz;
	vec3 v02 =coords[2].xyz - coords[0].xyz;
	normal = normalize( cross(v01, v02));
	normal = 0.2* ((normalize((v01 + v02)) + 4.0 * normal)); //convex effect

	
	// TODO: transform everything
	// DAAAAMN: transformation etc needs to move either in the noise texture calculation
	// Or in a step between: from the noise to the coordinates incl. transformation
	// 
	// Damnit

	for(int i = 0; i < 3; i++) {
		vec4 t = camera * vec4(coords[i], 1);
		coords[i] = vec3(
			t.x / ( -t.z * 0.4), 
			t.y / ( -t.z * 0.4), 
			t.z
		);
	}

	gl_Position = vec4(
		coords[0].xy, // readily calculated screen coords 
		- coords[0].z * 0.1, // adjust for depth testing
		1 // don't do perspective transformation - we've done it!
	); //vec4(coords[0].xy, -coords[0].z * 0.1, -coords[0].z);

	// edge distance: note this trick to circumvent perspective interpolation: 
	// stackoverflow - /41851699/gles-and-noperspective

	edgeDistances = vec3(0, 0, 0);
	vec2 n = normalize(coords[2].xy - coords[1].xy);
	vec2 h = coords[1].xy - coords[0].xy;
	edgeDistances[triangleEdgeId] = ( length(h - dot(h, n) * n) );

	z = coords[0].z;
}
