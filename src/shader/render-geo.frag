#version 300 es 

precision mediump float;

const vec3 baseColor = vec3(0); //vec3(0.6, 0.0, 0.2);

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
	col += vec3(1,0,0) * dot(vec3(1,1,0.1),normal); // red sun
	// col += vec3(0.1,0.1,0.8) * dot(vec3(0,0,-1), normal); // blue sky

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

	float opacity = ( z + 1.85 - fog ) 
		* smoothstep(border, border - 2.0 * pixelSize, edgeDistance);

	// col = pow(col, vec3(0.4545));

	fragColor = vec4(col, opacity * microscope) ;//opacity);
		
}
