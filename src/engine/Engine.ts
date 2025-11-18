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
    lastUpdate: number;
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
        this.lastUpdate = Date.now();
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
    }


    public render() {
        // compile pipeline
        let pipeline = this.getPipeline("simple triangle", PipelineKind.RENDER)!;

        let descriptor: GPURenderPassDescriptor = {
            label: "basic descriptor",
            colorAttachments: [
                {
                    view: this.canvasContext.getCurrentTexture().createView(),
                    clearValue: [0, 0, 1, 1],
                    loadOp: "clear",
                    storeOp: "store"
                }
            ]
        }

        const encoder = this.device.createCommandEncoder();
        
        const pass = encoder.beginRenderPass(descriptor);
        pass.setPipeline(pipeline);
        pass.draw(3);
        pass.end();

        const buffer = encoder.finish();

        // submit
        this.device.queue.submit([buffer]);
    }

    public update() {

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
            }
        });

        this.createComputePipeline("compute", {
            layout: "auto",
            compute: {
                module: simpleShaders
            }
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

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.render();
    }
}