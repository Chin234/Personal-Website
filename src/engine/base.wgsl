struct VertexOut {
    @builtin(position) position: vec4f
}

@vertex
fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
    let vertices = array(
        vec2f( 0.0,  0.5),  // top center
        vec2f(-0.5, -0.5),  // bottom left
        vec2f( 0.5, -0.5)   // bottom right
    );

    return VertexOut(
       vec4f(vertices[index], 0, 1)
    );
}

@fragment
fn fs(in: VertexOut) ->  @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);
}

@group(0) @binding(0) var ourTexture: texture_storage_2d<bgra8unorm, write>;

@compute @workgroup_size(1, 1)
fn cs(@builtin(global_invocation_id) global_invocation_id: vec3u) {
    let size = textureDimensions(ourTexture);
    let uv = vec2f(global_invocation_id.xy) / vec2f(size);

    textureStore(ourTexture, global_invocation_id.xy, vec4f(uv, 0, 1));
}