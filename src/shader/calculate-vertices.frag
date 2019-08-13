#version 300 es

precision mediump float;

uniform float time;
uniform float progress; 

in vec2 st;

out vec4 vertex; 

vec4 SGPP_coord_prepare(vec4 x) { return x - floor(x * ( 1.0 / 289.0 )) * 289.0; }
vec3 SGPP_coord_prepare(vec3 x) { return x - floor(x * ( 1.0 / 289.0 )) * 289.0; }
vec4 SGPP_permute(vec4 x) { return fract( x * ( ( 34.0 / 289.0 ) * x + ( 1.0 / 289.0 ) ) ) * 289.0; }
vec4 SGPP_resolve(vec4 x) { return fract( x * ( 7.0 / 288.0 ) ); }
vec4 SGPP_hash_2D( vec2 gridcell )		//	generates a random number for each of the 4 cell corners
{
    //    gridcell is assumed to be an integer coordinate
    vec4 hash_coord = SGPP_coord_prepare( vec4( gridcell.xy, gridcell.xy + 1.0 ) );
    return SGPP_resolve( SGPP_permute( SGPP_permute( hash_coord.xzxz ) + hash_coord.yyww ) );
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec4 r = SGPP_hash_2D(i);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(r.x, r.y, u.x) +
            (r.z - r.x) * u.y * (1.0 - u.x) +
            (r.w - r.y) * u.x * u.y - 0.5;
}

#define OCTAVES 5
// radians(360/OCTAVES * floor(OCTAVES/2))
#define ROTATE_ANGLE 
#define COS -0.80901699
#define SIN 0.587785

float water (in vec2 st) {
    float value = 0.5;
    float amplitude = .5;
	vec2 wave_direction = vec2(0.3,0.2);
	const mat2 rotation = mat2(COS, SIN, -SIN, COS); 

    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st + time * wave_direction / float(i+5) * 5.0);
        st *= 2.0;
        amplitude *= 0.8;
		wave_direction = rotation * wave_direction;
    }
    return value;
}

void main() {
    vec2 st2 = st * 5.0;

	// coords
    vertex.xyz = vec3(
    	water(st2),
    	water(st2+231.3219),
    	water(st2-98.12)
	); 

	// progress
	vertex.w = water(st); 
}
