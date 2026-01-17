import { Vector2 } from "@math.gl/core";
import simpleShaders from "./base.wgsl?raw"

enum PipelineKind {
    RENDER,
    COMPUTE
}

type PipelineKindMapping = {
    [PipelineKind.RENDER]: GPURenderPipeline,
    [PipelineKind.COMPUTE]: GPUComputePipeline
}


export default class Engine {
    device: GPUDevice;
    canvas: HTMLCanvasElement;
    time: number;
    canvasContext: GPUCanvasContext;
    preferredFormat: GPUTextureFormat;
    canvasSize: Vector2;
    shaderModules: Map<string, GPUShaderModule>;
    pipelines: Map<string, [PipelineKind, GPUPipelineBase]>;
    buffers: Map<string, GPUBuffer>;
    bindGroups: Map<string, GPUBindGroup>;

    constructor(element: HTMLCanvasElement, device: GPUDevice) {
        this.canvas = element;
        this.device = device;
        this.time = performance.now() / 1000;
        const context = this.canvas.getContext("webgpu");
        if (context == null) {
            throw new Error("No WebGPU support!");
        }
        this.canvasContext = context;

        this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
        
        context.configure({
            device: device,
            format: this.preferredFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING	
        })

        this.canvasSize = new Vector2(this.canvas.width, this.canvas.height);

        this.shaderModules = new Map();
        this.pipelines = new Map();
        this.bindGroups = new Map();
        this.buffers = new Map();

        this.setupShaders();
        this.setupPipelines();
        this.setupBuffers();
        this.setupBindGroups();
    }


    public render() {
        
        this.time = performance.now() / 1000;
        var data = new Float32Array([
            this.canvasSize.x,
            this.canvasSize.y,
            this.time
        ]);
        this.device.queue.writeBuffer(this.getBuffer("variables")!, 0, data, 0, 3);
        let pipeline = this.getPipeline("simple triangle", PipelineKind.RENDER)!;
        let descriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.canvasContext.getCurrentTexture().createView(),
                    storeOp: "store",
                    loadOp: "clear"
                }
            ]
        }

        let encoder = this.device.createCommandEncoder();
        let pass = encoder.beginRenderPass(descriptor)
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, this.getBindGroup("group"));
        pass.draw(4);
        pass.end();
        
        let buffer = encoder.finish();

        // submit
        this.device.queue.submit([buffer]);
    }

    private setupShaders() {
        this.compileModule("simple shaders", simpleShaders);
    }

    private setupPipelines() {
        const simpleShaders = this.getShader("simple shaders")!;

        this.createRenderPipeline("simple triangle", {
            layout: "auto",
            vertex: {
                module: simpleShaders
            },
            fragment: {
                module: simpleShaders,
                targets: [
                    {
                        format: this.preferredFormat
                    }
                ]
            },
            primitive: {
                topology: "triangle-strip"
            }
        });

    }

    private setupBuffers() {
        this.createBuffer("variables", { 
            size: 16,
            usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST
        })
    }

    private setupBindGroups() {
        var pipeline = this.getPipeline("simple triangle", PipelineKind.RENDER)!;
        this.createBindGroup("group", {
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0,
                    resource: {
                        buffer: this.getBuffer("variables")!
                    }
                }
            ]
        })
    }

    /* ==========================================================================================
     * BELOW IS ENGINE HELPER CODE
     * ========================================================================================== */

    private getShader(name: string): GPUShaderModule | undefined{
        return this.shaderModules.get(name);
    }

    private compileModule(name: string, source: string): GPUShaderModule {
        let module = this.device.createShaderModule({
            code: source,
            label: name
        })

        this.shaderModules.set(name, module);

        return module;
    }

    private createRenderPipeline(name: string, desc: GPURenderPipelineDescriptor) {
        if (desc.label == undefined) {
            desc.label = name;
        }
        
        const pipeline = this.device.createRenderPipeline(desc);
        
        this.pipelines.set(name, [PipelineKind.RENDER, pipeline]);
    }

    private createComputePipeline(name: string, desc: GPUComputePipelineDescriptor) {
        if (desc.label == undefined) {
            desc.label = name;
        }
        
        const pipeline = this.device.createComputePipeline(desc);
        this.pipelines.set(name, [PipelineKind.COMPUTE, pipeline]);
    }

    private getPipeline<T extends PipelineKind>(name: string, kind: T): PipelineKindMapping[T] | null {
        if (!this.pipelines.has(name)) {
            return null;
        }

        const stored = this.pipelines.get(name)!;

        if (stored[0] == kind) {
            return stored[1] as PipelineKindMapping[T];
        }

        return null;
    }

    private createBuffer(name: string, desc: GPUBufferDescriptor) {
        let buf = this.device.createBuffer(desc);

        this.buffers.set(name, buf);
    }

    private getBuffer(name: string): GPUBuffer | undefined { 
        return this.buffers.get(name);
    }

    private getBindGroup(name: string): GPUBindGroup | undefined {
        return this.bindGroups.get(name);
    }

    private createBindGroup(name: string, desc: GPUBindGroupDescriptor) {
        if (desc.label == undefined) {
            desc.label = name;
        }
        
        let group = this.device.createBindGroup(desc);

        this.bindGroups.set(name, group);
    }

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvasSize.x = width;
        this.canvasSize.y = height;
        this.render();
    }
}