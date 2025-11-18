<script lang="ts">
    import ChinCanvas from "./engine/ChinCanvas.svelte";
    import Counter from "./lib/Counter.svelte";

</script>

<div class="container">
  <header>
    <ChinCanvas />
  </header> 
  <main>
    blah blah blah

    <Counter />
    <Counter count={69}>
      Count deez nuts 
    </Counter>
  </main>
</div>

<style>
  header {
    width: 100%;
    height: 100vh;
    background: green;
    scroll-snap-align: end;
  }

  main {
    width:100%;
    height: 100vh;
    scroll-snap-align: start;
  }

  .container {
    width: 100%;
    margin: 0;
    height: fit-content;
    display:flex;
    flex-direction: column;
  }
</style>
