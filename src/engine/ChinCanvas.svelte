<script lang="ts">
    import { onMount } from "svelte";
    import Engine from "./Engine";


    let g: HTMLCanvasElement;
    onMount(async () => {
        
        g.width = g.clientWidth;
        g.height = g.clientHeight;

        let adapter = await navigator.gpu?.requestAdapter();
        let device = await adapter?.requestDevice({
            requiredFeatures: ["bgra8unorm-storage"]
        });
        if (device == null) {
            throw new Error("Unsupported webgpu!");
        }
        let engine = new Engine(g, device);

        engine.render();

        let observer = new ResizeObserver((entries) => {
            let x = entries[0];

            engine.resize(x.contentRect.width, x.contentRect.height);
        });

        observer.observe(g);
    })
</script>

<canvas bind:this={g}>

</canvas>

<style>
    canvas {
        width: 100%;
        height: 100%;
    }
</style>