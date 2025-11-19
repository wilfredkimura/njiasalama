<script>
    // @ts-ignore
    /** @type {string} */
    export let routeId;
    let rating = 0;
    let submitted = false;

    /** @param {number} r */
    function submitRating(r) {
        console.log("Rating route:", routeId);
        rating = r;
        submitted = true;
        // TODO: Save to backend
    }

    function close() {
        submitted = true;
    }
</script>

{#if !submitted}
    <div
        class="fixed bottom-24 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-[900] border border-gray-100"
    >
        <div class="relative">
            <button
                on:click={close}
                class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-5 h-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
            <h3 class="font-bold text-center mb-3">
                How safe does this route feel?
            </h3>
        </div>
        <div class="flex justify-between gap-1">
            {#each Array(10) as _, i}
                <button
                    class="w-8 h-10 rounded bg-gray-100 hover:bg-green-100 hover:text-green-700 font-bold text-sm transition-colors"
                    on:click={() => submitRating(i + 1)}
                >
                    {i + 1}
                </button>
            {/each}
        </div>
    </div>
{/if}
