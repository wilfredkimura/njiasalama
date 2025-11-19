<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { fetchHazards } from "$lib/stores/hazardStore";
  import HazardSheet from "$lib/components/HazardSheet.svelte";
  import { checkSession, user, signOut } from "$lib/stores/authStore";

  onMount(() => {
    fetchHazards();
    checkSession();
  });
</script>

<slot />
<HazardSheet />

<div
  class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/70 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/40 text-xs text-gray-600 pointer-events-auto"
>
  Made by <a
    href="https://wilfredkimuraportfolio.vercel.app"
    target="_blank"
    rel="noopener noreferrer"
    class="font-semibold text-black hover:underline">Kimura Mutahi</a
  > 2025
</div>
