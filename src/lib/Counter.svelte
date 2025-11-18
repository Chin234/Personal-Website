<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    count?: number;
    children?: Snippet;
  }

  let { count = $bindable(0), children }: Props = $props();
</script>

<button onclick={() => count++}>
  count is {count}
  {#if children != undefined}
    {@render children()}
  {/if}
</button>
