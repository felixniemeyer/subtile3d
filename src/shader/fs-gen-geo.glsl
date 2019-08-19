#version 300 es 

precision mediump float;

uniform sampler2D plasmaTex; 
uniform int quadCountSqrt; 
uniform float vertexCountSqrtInverse;
uniform float quadCountSqrtInverse;
uniform float cameraSpread; 
uniform float flatness; // 0 = maximum honeycomb look
uniform float shape;

// prism sides layout
//
//   #B #B
// 1 A# A#
//
//   #B #B
// 0 A# A#
//
//	 0  1
uniform mat4 prismSide00A; 
uniform mat4 prismSide00B; 
uniform mat4 prismSide01A; 
uniform mat4 prismSide01B; 
uniform mat4 prismSide10A; 
uniform mat4 prismSide10B; 
uniform mat4 prismSide11A; 
uniform mat4 prismSide11B; 

uniform mat4 camera;

in vec2 ts;

// v0, v1, v2 have the edgeDistance as 4th component
layout(location = 0) out vec4 v0;
layout(location = 1) out vec4 v1;
layout(location = 2) out vec4 v2;
// 4th component: still one value left - maybe the individual progress? 
layout(location = 3) out vec4 lookAt;

void main() {

	// field
	ivec2 quadId = ivec2(ts * vec2(2,1) * float(quadCountSqrt));
	ivec2 edgeOffset[3];
	if(quadId.x >= quadCountSqrt){
		quadId.x -= quadCountSqrt;
		edgeOffset[0] = ivec2(1,0);
		edgeOffset[1] = ivec2(1,1);
		edgeOffset[2] = ivec2(0,1);
	} else {
		edgeOffset[0] = ivec2(0,0);
		edgeOffset[1] = ivec2(1,0);
		edgeOffset[2] = ivec2(0,1);
	}

	vec2 st[3]; 
	vec3 coords[3];
	vec4 plasma[3]; 
	vec3 fieldCoords[3]; 
	for(int i = 0; i < 3; i++) {
		st[i] = (vec2(quadId + edgeOffset[i]) + vec2(0.5))  * vertexCountSqrtInverse;
		plasma[i] = texture(plasmaTex, st[i]); // vCSqrt = qCSqrt + 1
		coords[i] = 
			vec3(vec2(quadId + edgeOffset[i]) * quadCountSqrtInverse, 0) 
			* 2.0 // quad spans 0 to 2
			- vec3(1,1,0); // quad spans -1 to 1
	}

	mat4 transform; 
	vec2 decidor = coords[0].xy + (coords[1].xy + coords[2].xy - 2.0 * coords[0].xy) * 0.333;
//	st[0] + 0.33333 * (st[1] + st[2] - 2.0 * st[0]) + quadCountSqrtInverse * vec2(0.1,0.1);

	float xySum = decidor.x + decidor.y;
	vec3 sides; 
	int halfQuadCountSqrt = quadCountSqrt / 2;
	if(quadId.y < halfQuadCountSqrt) {
		if(quadId.x < halfQuadCountSqrt) {
			if(xySum < -1.0) {
				transform = prismSide00A;
				sides = vec3(-1, -1, -1);
			} else {
				transform = prismSide00B;
				sides = vec3(0, 0, -1);
			}
		} else {
			if(xySum < 0.0) {
				transform = prismSide10A;
				sides = vec3(0, -1, 0);
			} else {
				transform = prismSide10B;
				sides = vec3(1, 0, 0);
			}
		}
	} else {
		if(quadId.x < halfQuadCountSqrt) {
			if(xySum < 0.0) {
				transform = prismSide01A;
				sides = vec3(-1, 0, 0);
			} else {
				transform = prismSide01B;
				sides = vec3(0, 1, 0);
			}
		} else {
			if(xySum < 1.0) {
				transform = prismSide11A;
				sides = vec3(0, 0, 1);
			} else {
				transform = prismSide11B;
				sides = vec3(1, 1, 1);
			}
		}
	}
	vec3 prismCoords[3];
	vec3 closeness;
	float sideDistance;
	for(int i = 0; i < 3; i++) {
		prismCoords[i] = ( transform * vec4(coords[i], 1) ).xyz;
	}

	// model transform 
	float avgW = (plasma[0].w + plasma[1].w + plasma[2].w) * 0.333;
	float fragment = 0.5;
	float a, ip;
	for(int i = 0; i < 3; i++) {
		a = clamp(((plasma[i].w + avgW * 4.0) * 0.2 - 0.5) * 2.5 + 0.5, 0.0, 1.0) * fragment;
		ip = smoothstep(a, a + (1.0 - fragment), shape);
		// TODO: add rotation around z axis
		closeness.x = abs(coords[i].x - sides.x);
		closeness.y = abs(coords[i].y - sides.y);
		closeness.z = abs(coords[i].x + coords[i].y - sides.z);
		sideDistance = pow(closeness.x * closeness.y * closeness.z, 0.3333);
		coords[i] = (1.0 - ip) * coords[i] + ip * prismCoords[i];
		coords[i] += 
			((1.0 - ip) + ip * sideDistance) 
			* (plasma[i].xyz - vec3(0.5,0.5,0.5)) * 4.0 * quadCountSqrtInverse; // adding deviation 
	}

	// normal calculation
	vec3 c01 = coords[1] - coords[0];
	vec3 c02 = coords[2] - coords[0];
	lookAt = vec4(normalize(cross(c01,c02)), 1);

	// camera transform & perspective
	for(int i = 0; i < 3; i++) {
		vec4 t = camera * vec4(coords[i], 1);
		coords[i] = vec3(
			t.x / ( -t.z * cameraSpread), 
			t.y / ( -t.z * cameraSpread), 
			t.z
		);
	}

	// edge distance calculation
	int e1, e2;
	vec2 n, h; 
	float edgeDistance[3];
	for(int i = 0; i < 3; i++) {
		e1 = i + 1 > 2 ? 0 : i + 1;
		e2 = i + 2 > 2 ? i - 1 : 2;
		vec2 n = normalize(coords[e2].xy - coords[e1].xy);
		vec2 h = coords[e1].xy - coords[i].xy;
		edgeDistance[i] = length(h - dot(h, n) * n);
	}

	// write out
	v0 = vec4(coords[0], edgeDistance[0]);
	v1 = vec4(coords[1], edgeDistance[1]);
	v2 = vec4(coords[2], edgeDistance[2]);
}
