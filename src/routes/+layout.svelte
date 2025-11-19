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

<div class="fixed top-20 right-4 z-[1000]">
  {#if $user}
    <button
      on:click={signOut}
      class="bg-white/90 backdrop-blur text-black px-3 py-1 rounded-full shadow-sm text-xs font-bold hover:bg-gray-100 border border-gray-200"
    >
      Sign Out
    </button>
  {:else}
    <a
      href="/login"
      class="bg-black text-white px-3 py-1 rounded-full shadow-sm text-xs font-bold hover:bg-gray-800"
    >
      Login
    </a>
  {/if}
</div>

<slot />
<HazardSheet />
