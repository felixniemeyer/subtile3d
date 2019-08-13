#version 300 es 

precision mediump float;

uniform sampler2D tex; 

in vec2 ts; 

out vec4 fragColor; 

void main() {
	fragColor = texture(tex, ts);
}
