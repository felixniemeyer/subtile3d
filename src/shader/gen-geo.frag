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
	vec2 quadIdNorm = ts * vec2(2,1);
	vec2 st[3];
	if(quadIdNorm.x >= 1.0){
		quadIdNorm.x -= 1.0;
		st[0] = vec2(1,0);
		st[1] = vec2(1,1);
		st[2] = vec2(0,1);
	} else {
		st[0] = vec2(0,0);
		st[1] = vec2(1,0);
		st[2] = vec2(0,1);
	}

	vec3 coords[3];
	vec4 plasma[3]; 
	vec3 fieldCoords[3]; 
	for(int i = 0; i < 3; i++) {
		st[i] = st[i] * quadCountSqrtInverse * 0.9 + quadIdNorm ;
		plasma[i] = texture(plasmaTex, st[i]); // vCSqrt = qCSqrt + 1
		coords[i] = 
			vec3(st[i], 0) 
			* 2.0 // quad spans 0 to 2
			- vec3(1,1,0); // quad spans -1 to 1
		fieldCoords[i] = 
			coords[i]
			+ (plasma[i].xyz - vec3(0.5,0.5,0.5)) * 4.0 * quadCountSqrtInverse; // adding deviation 
	}

	mat4 transform; 
	vec2 decidor = st[0] + 0.33333 * (st[1] + st[2] - 2.0 * st[0]) - quadCountSqrtInverse * vec2(0.1,0.1);

	float xySum = decidor.x + decidor.y;
	if(quadIdNorm.y < 0.5) {
		if(quadIdNorm.x < 0.5) {
			if(xySum < 0.5) {
				transform = prismSide00A;
			} else {
				transform = prismSide00B;
			}
		} else {
			if(xySum < 1.0) {
				transform = prismSide10A;
			} else {
				transform = prismSide10B;
			}
		}
	} else {
		if(quadIdNorm.x < 0.5) {
			if(xySum < 1.0) {
				transform = prismSide01A;
			} else {
				transform = prismSide01B;
			}
		} else {
			if(xySum < 1.5) {
				transform = prismSide11A;
			} else {
				transform = prismSide11B;
			}
		}
	}
	vec3 prismCoords[3];
	for(int i = 0; i < 3; i++) {
		prismCoords[i] = ( transform * vec4(coords[i], 1) ).xyz;
	}

	// model transform 
	float avgW = (plasma[0].w + plasma[1].w + plasma[2].w) * 0.333;

	float fragment = 0.7;
	float a, ip;
	for(int i = 0; i < 3; i++) {
		a = clamp(((plasma[i].w + avgW * 3.0) * 0.25 - 0.5) * 2.5 + 0.5, 0.0, 1.0) * fragment;
		ip = 1.0; //smoothstep(a, a + (1.0 - fragment), shape);
		// TODO: add rotation around z axis
		coords[i] = (1.0 - ip) * fieldCoords[i] + ip * prismCoords[i];
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
