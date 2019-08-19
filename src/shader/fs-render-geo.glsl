#version 300 es 

precision mediump float;

const vec3 baseColor = 0.8 * vec3(0.80, 0.0, 0.5);

uniform float pixelSize; 
uniform float progress; 
uniform float borderSize; 
uniform float borderZWeight;
uniform float cells;
uniform float cellSize;
uniform float fog; 
uniform float resolutionInverse; 

in vec3 edgeDistances; 
in float z; 
in vec3 normal; 

out vec4 fragColor; 

void main() {
	vec3 col = baseColor;
	if(gl_FrontFacing) {
		col += normal * 0.2;
		col += vec3(-0.8, 0, 0.1) * clamp(dot(vec3(1,0,0),normal), 0.0, 1.0); 
		col += vec3(0.4, 0.4, 1.8) * clamp(dot(vec3(0.3, 1.0, 0.1), normal), 0.0, 1.0);
		col += vec3(0.7, 0.0, 0.0) * clamp(dot(vec3(-0.1, -0.6, -0.3), normal), 0.0, 1.0); 

//		col += vec3(0.1,0.1,0.1) * clamp(dot(vec3(0,1,0),normal), 0.0, 1.0);
//		col += vec3(0,0,0.5) * clamp(dot(vec3(0,0,1), normal), 0.0, 1.0); 
//	 	col += vec3(0.0,0.0,1.0) * dot(vec3(-0.3,0.3,0.2), normal) * (z - 0.5); // blue sky
	} else {
		col *= 0.33;
	}

	float distanceFromCenter = smoothstep(0.3,1.0,
		length(gl_FragCoord.xy * resolutionInverse * 2.0 - vec2(1))
	);

	float border = borderSize + borderZWeight * z; 
	float edgeDistance = min(min(edgeDistances.x, edgeDistances.y), edgeDistances.z);
	float inCell = pow(edgeDistances.x * edgeDistances.y * edgeDistances.z, 0.333) * cellSize;
	float microscope = (1.0 - cells) + cells * smoothstep(
		distanceFromCenter, 
		distanceFromCenter + 0.44/(distanceFromCenter + 1.0) , 
		smoothstep(0.1, 1.01, inCell)
	);

	float opacity = max(0.0, ( z + 1.85 - fog ) 
		* smoothstep(border, border - 2.0 * pixelSize, edgeDistance));
	opacity = opacity * opacity;

	col = pow(col, vec3(0.6545));

	fragColor = vec4(col, opacity * microscope) ;//opacity);
		
}
