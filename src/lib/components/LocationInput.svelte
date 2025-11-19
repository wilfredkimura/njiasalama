<script>
    import { createEventDispatcher } from "svelte";

    export let placeholder = "Search location";
    export let value = "";

    const dispatch = createEventDispatcher();

    /** @type {Array<{display_name: string, lat: string, lon: string}>} */
    let suggestions = [];
    let loading = false;
    /** @type {NodeJS.Timeout} */
    let timer;

    /**
     * @param {string} input
     */
    function isCoordinate(input) {
        // Simple regex for "lat, lng" or "lat lng"
        return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(input.trim());
    }

    async function handleInput() {
        clearTimeout(timer);
        suggestions = [];

        if (!value || value.length < 3) return;

        if (isCoordinate(value)) {
            // If it looks like a coordinate, don't search, just let it be
            return;
        }

        timer = setTimeout(async () => {
            loading = true;
            try {
                // Using Nominatim for demo purposes. In production, use a proper geocoding service or proxy.
                // User-Agent is required by Nominatim TOS.
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
                    {
                        headers: {
                            "User-Agent": "NjiaSalama-PWA/0.1",
                        },
                    },
                );
                if (res.ok) {
                    suggestions = await res.json();
                }
            } catch (e) {
                console.error("Geocoding error:", e);
            } finally {
                loading = false;
            }
        }, 500); // 500ms debounce
    }

    /** @param {{display_name: string, lat: string, lon: string}} item */
    function selectSuggestion(item) {
        value = item.display_name;
        suggestions = [];
        dispatch("select", {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name: item.display_name,
        });
    }
</script>

<div class="relative w-full">
    <input
        type="text"
        bind:value
        on:input={handleInput}
        {placeholder}
        class="bg-transparent w-full outline-none text-sm font-medium truncate"
    />

    {#if loading}
        <div class="absolute right-0 top-0 bottom-0 flex items-center pr-2">
            <div
                class="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"
            ></div>
        </div>
    {/if}

    {#if suggestions.length > 0}
        <ul
            class="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-[1000]"
        >
            {#each suggestions as item}
                <li>
                    <button
                        class="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 transition-colors"
                        on:click={() => selectSuggestion(item)}
                    >
                        <p class="font-medium truncate text-gray-900">
                            {item.display_name.split(",")[0]}
                        </p>
                        <p class="text-xs text-gray-500 truncate">
                            {item.display_name}
                        </p>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>
