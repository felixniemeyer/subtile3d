#version 300 es 

layout(location = 0) in vec2 vert; 

out vec2 st; 

void main() {
	gl_Position = vec4(vert, 0, 1);
	st = ( vert + vec2(1,1) ) * 0.5;
}
