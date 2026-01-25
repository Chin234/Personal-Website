<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Engine from "./Engine";
    import ASCII from "../assets/ASCII.png"

    let g: HTMLCanvasElement;
    let engine: Engine;
    let timeout: number = 0;
    
    function animate() {
        engine.render();
        timeout = requestAnimationFrame(animate);
    }

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
        var texture = await createImageBitmap(await (await fetch(ASCII)).blob(), { colorSpaceConversion: 'none' })

        engine = new Engine(g, device, texture);

        animate();

        let observer = new ResizeObserver((entries) => {
            let x = entries[0];

            engine.resize(x.contentRect.width, x.contentRect.height);
        });

        observer.observe(g);
    })

    onDestroy(() => {
        cancelAnimationFrame(timeout);
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