<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { fetchHazards } from "$lib/stores/hazardStore";
  import HazardSheet from "$lib/components/HazardSheet.svelte";

  onMount(() => {
    fetchHazards();
  });
</script>

<slot />
<HazardSheet />
