// 3D simplex noise adapted from https://www.shadertoy.com/view/Ws23RD
// * Removed gradient normalization and updated to wgsl
fn mod289(x: vec4f) -> vec4f {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn permute(x: vec4f) -> vec4f {
    return mod289(((x * 34.0) + 1.0) * x);
}

fn snoise(v: vec3f) -> vec4f {
    const C = vec2f(1.0 / 6.0, 1.0 / 3.0);

    // First corner
    let i  = floor(v + dot(v, vec3f(C.y)));
    let x0 = v - i + dot(i, vec3f(C.x));

    // Other corners
    let g = step(x0.yzx, x0.xyz);
    let l = 1.0 - g;
    let i1 = min(g.xyz, l.zxy);
    let i2 = max(g.xyz, l.zxy);

    let x1 = x0 - i1 + C.x;
    let x2 = x0 - i2 + C.y;
    let x3 = x0 - 0.5;

    // Permutations
    let p = permute(permute(permute(i.z + vec4f(0.0, i1.z, i2.z, 1.0))
                                  + i.y + vec4f(0.0, i1.y, i2.y, 1.0))
                                  + i.x + vec4f(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    let j = p - 49.0 * floor(p * (1.0 / 49.0));  // mod(p,7*7)

    let x_ = floor(j * (1.0 / 7.0));
    let y_ = floor(j - 7.0 * x_); 

    let x = (x_ * 2.0 + 0.5) * (1.0 / 7.0) - 1.0;
    let y = (y_ * 2.0 + 0.5) * (1.0 / 7.0) - 1.0;

    let h = 1.0 - abs(x) - abs(y);

    let b0 = vec4f(x.xy, y.xy);
    let b1 = vec4f(x.zw, y.zw);

    let s0 = floor(b0) * 2.0 + 1.0;
    let s1 = floor(b1) * 2.0 + 1.0;
    let sh = -step(h, vec4f(0.0));

    let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    let a1 = b1.xzyw + s1.xzyw * sh.zzww;

    let g0 = vec3f(a0.xy, h.x);
    let g1 = vec3f(a0.zw, h.y);
    let g2 = vec3f(a1.xy, h.z);
    let g3 = vec3f(a1.zw, h.w);

    // Compute noise and gradient at P
    let m = max(0.6 - vec4f(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4f(0.0));
    let m2 = m * m;
    let m3 = m2 * m;
    let m4 = m2 * m2;

    let grad =
      -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
      -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
      -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
      -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;
      
    let px = vec4f(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
    
    return 42.0 * vec4f(grad, dot(m4, px));
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f
}

struct Uniforms { 
    screenSize: vec2f,
    time: f32
}

@vertex
fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
    let vertices = array(
        vec2f(1, 1),
        vec2f(1, -1),
        vec2f(-1, 1),
        vec2f(-1, -1),
    );

    let colors = array(
        vec2f(1, 1),
        vec2f(1, 0),
        vec2f(0, 1),
        vec2f(0, 0)
    );

    return VertexOut(
       vec4f(vertices[index], 0, 1),
       colors[index]
    );
}

@group(0) @binding(0) var <uniform> variables: Uniforms;
@group(0) @binding(1) var asciiChars: texture_2d<f32>;

const pixelSize = 128;
const intensityValue = 8;
const timeRate = 5;

@fragment
fn fs(in: VertexOut) ->  @location(0) vec4f {
    let ratio = variables.screenSize.x/variables.screenSize.y;
    let pixPos = (floor((in.uv * variables.screenSize) / pixelSize) * pixelSize) / variables.screenSize;
    var pos = vec3 ( pixPos * 4 * vec2(ratio, 1), variables.time / timeRate);
    var noisy = snoise(pos); 

    pos += noisy.xyz * 0.05;
    noisy = snoise(pos);
    pos += noisy.xyz * 0.05;
    noisy = snoise(pos);

    var intensity = 1 - ((noisy.w * 0.5) + 0.5);
    let index = i32(floor(intensity * intensityValue));
    let coordinate = vec2u(in.uv * variables.screenSize) % textureDimensions(asciiChars);
    return vec4(textureLoad(asciiChars, coordinate, 0).xyz, 1);

    //return vec4(vec3(pow(intensity, 2)), 1);
}
