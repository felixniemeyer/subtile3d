#version 300 es

layout (location = 0) in uint vert; 

//uniforms...

uniform sampler2D geoTexV0; 
uniform sampler2D geoTexV1;
uniform sampler2D geoTexV2;
uniform sampler2D geoTexLookAt;

uniform int quadCountSqrt;

out vec3 edgeDistances;
out float z;
out vec3 normal; 

int imod(in int a, in int div) {
	return a - (a / div) * div;
}

void main() {
	int quadId = gl_VertexID / 6;
	int edgeId = gl_VertexID - quadId;
	int sOffset = 0;
	if(edgeId > 2) {
		edgeId -= 3;
		sOffset = quadCountSqrt;
	}

	vec2 st = vec2(
		float(imod(quadId, quadCountSqrt) + sOffset),
		float(quadId / quadCountSqrt)
	);
	st = st + vec2(0.5);
	st = st * vec2(0.5, 1); 

	vec4 v;
	if(edgeId == 0){
		v = texture(geoTexV0, st);
	} else if(edgeId == 1){
		v = texture(geoTexV1, st);
	} else {
		v = texture(geoTexV2, st);
	}

	vec4 lookAt = texture(geoTexLookAt, st);

	gl_Position = vec4(
		v.xy, // readily calculated screen coords 
		- v.z * 0.1, // adjust for depth testing
		1 // don't do perspective transformation - we've done it!
	); 

	normal = normalize(lookAt.xyz - v.xyz);

	edgeDistances = vec3(0, 0, 0);
	edgeDistances[edgeId] = v.w;

	z = v.z;
}
