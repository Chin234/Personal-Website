struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f
}

@vertex
fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
    let vertices = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, 0.5),
        vec2f(-0.5, -0.5),
    );

    let colors = array(
        vec3f(1, 0, 0),
        vec3f(0, 1, 0),
        vec3f(0, 0, 1),
        vec3f(1, 1, 1)
    );

    return VertexOut(
       vec4f(vertices[index], 0, 1),
       colors[index]
    );
}

@fragment
fn fs(in: VertexOut) ->  @location(0) vec4f {
    return vec4(in.color, 1);
}

@group(0) @binding(0) var ourTexture: texture_storage_2d<bgra8unorm, write>;

struct Uniforms {
    time: f32
}

@group(1) @binding(0) var<uniform> uniforms: Uniforms;


@compute @workgroup_size(1, 1)
fn cs(@builtin(global_invocation_id) global_invocation_id: vec3u) {
    let size = textureDimensions(ourTexture);
    let aspect = f32(size.x) / f32(size.y);
    var uv = vec2f(global_invocation_id.xy) / vec2f(size);

    uv *= 2;
    uv -= 1;

    uv.x *= aspect;
    var result = vec4f(0, 0, 1, 1);
    if ((uv.x * uv.x) + (uv.y * uv.y) < abs(sin(uniforms.time))) {
        result = vec4f(1, 0, 0, 1); 
    }
 
    textureStore(ourTexture, global_invocation_id.xy, result);
}