#version 300 es 

precision mediump float;

uniform sampler2D plasmaTex; 
uniform float quadCountSqrt;
uniform float vertexCountSqrtInverse;
uniform float quadCountSqrtInverse;
uniform float flatness; // 0 = maximum honeycomb look

uniform mat4 camera;

// v0, v1, v2 have the edgeDistance as 4th component
layout(location = 0) out vec4 v0;
layout(location = 1) out vec4 v1;
layout(location = 2) out vec4 v2;
// 4th component: still one value left - maybe the individual progress? 
layout(location = 3) out vec4 lookAt;

void main() {

	// field
	vec2 quadId = gl_FragCoord.xy * vec2(2,1) * quadCountSqrt;
	vec2 edge[3];
	if(gl_FragCoord.x >= quadCountSqrt){
		quadId.x -= quadCountSqrt;
		edge[0] = vec2(1,0);
		edge[1] = vec2(1,1);
		edge[2] = vec2(0,1);
	} else {
		edge[0] = vec2(0,0);
		edge[1] = vec2(1,0);
		edge[2] = vec2(0,1);
	}

	vec3 coords[3]; 
	float edgeDistance[3];
	vec4 plasma[3]; 
	for(int i = 0; i < 3; i++) {
		edge[i] = edge[i] + quadId;
		plasma[i] = texture(plasmaTex, edge[i] * vertexCountSqrtInverse); // vCSqrt = qCSqrt + 1
		coords[i] = 
			vec3(edge[i], 0) * quadCountSqrtInverse * 2.0 // quad spans 0 to 2
			- vec3(1,1,0) // quad spans -1 to 1
			+ (plasma[i].xyz - vec3(0.5,0.5,0.5)) * 4.0 * quadCountSqrtInverse; // adding deviation 
	}

	// model transform 
	// none

	// normal calculation
	vec3 c01 = coords[1] - coords[0];
	vec3 c02 = coords[2] - coords[0];
	// instead of a normal: calculate a point with same distance to all points. 
	lookAt = vec4(
		(coords[0] + coords[1] + coords[2]) / 3.0 
		+ (cross(c01, c02) * quadCountSqrt * flatness ) // ' * quadCount' calibrates so that the lookAt is about as far away as the points are distant from each other
		, 1);


	// camera transform & perspective
	float cameraSpread = 0.4;
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
	for(int i = 0; i < 3; i++) {
		e1 = i + 1 > 2 ? 0 : i + 1;
		e2 = i + 2 > 2 ? i - 1 : 2;
		vec2 n = normalize(coords[e2].xy - coords[e1].xy);
		vec2 h = coords[e1].xy - coords[i].xy;
		edgeDistance[i] = length(h - dot(h, n) * n);
	}

	v0 = vec4(coords[0], edgeDistance[0]);
	v1 = vec4(coords[1], edgeDistance[1]);
	v2 = vec4(coords[2], edgeDistance[2]);

	// prism
	// TODO
}
