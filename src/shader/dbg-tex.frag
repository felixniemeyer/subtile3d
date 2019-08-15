#version 300 es 

precision mediump float;

uniform sampler2D tex; 
uniform vec4 valueShift; 
uniform vec4 valueScale; 

in vec2 ts; 

out vec4 fragColor; 

void main() {
	fragColor = (texture(tex, ts) + valueShift) * valueScale;
}
