<script>
    import AddHazardForm from "$lib/components/AddHazardForm.svelte";
    import Map from "$lib/components/Map.svelte";
    import { goto } from "$app/navigation";
    import { mapCenter } from "$lib/stores/mapStore";

    let step = "pick"; // 'pick' | 'details'
    let hazardLocation = null;

    // Initialize hazard location to map center if not set
    // We use a flag to ensure we only set it once initially
    let initialized = false;
    $: if (!initialized && $mapCenter) {
        hazardLocation = { lat: $mapCenter.lat, lng: $mapCenter.lng };
        initialized = true;
    }

    function handlePinDropped(e) {
        const { lat, lng } = e.detail;
        hazardLocation = { lat, lng };
    }

    function confirmLocation() {
        step = "details";
    }

    function close() {
        goto("/");
    }
</script>

<div class="w-full h-screen relative">
    <Map
        pinDropMode={step === "pick" ? "hazard" : "none"}
        {hazardLocation}
        on:pinDropped={handlePinDropped}
    />

    {#if step === "pick"}
        <div
            class="fixed top-4 left-0 right-0 z-[500] flex justify-center pointer-events-none"
        >
            <div
                class="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg pointer-events-auto text-center"
            >
                <h1 class="font-bold text-lg">Pinpoint Hazard</h1>
                <p class="text-xs text-gray-500">
                    Drag the pin to the exact location
                </p>
            </div>
        </div>

        <div class="fixed bottom-8 left-6 right-6 z-[500]">
            <div class="flex gap-4">
                <button
                    on:click={close}
                    class="bg-white text-gray-800 px-6 py-4 rounded-xl font-bold shadow-lg flex-1"
                >
                    Cancel
                </button>
                <button
                    on:click={confirmLocation}
                    class="bg-black text-white px-6 py-4 rounded-xl font-bold shadow-lg flex-[2]"
                >
                    Confirm Location
                </button>
            </div>
        </div>
    {/if}

    {#if step === "details"}
        <AddHazardForm location={hazardLocation} on:close={close} />
    {/if}
</div>
