#version 300 es

layout(location = 0) in vec2 vert;

uniform vec2 position; 
uniform vec2 size; 

out vec2 ts; 

void main() {
	ts = ( vert + vec2(1,1) ) * 0.5; 
	gl_Position = vec4( ((position + ts * size) - vec2(0.5)) * vec2(2,-2), 0, 1);
}
