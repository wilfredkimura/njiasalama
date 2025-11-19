<script>
    import Map from "$lib/components/Map.svelte";
    import UserMenu from "$lib/components/UserMenu.svelte";
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { browser } from "$app/environment";

    let showWelcome = true; // Show by default

    onMount(() => {
        // Only hide if user has permanently dismissed it
        const permanentlyDismissed =
            browser && localStorage.getItem("welcomeDismissed") === "permanent";
        if (permanentlyDismissed) {
            showWelcome = false;
        }
    });

    function closeWelcomeTemporary() {
        showWelcome = false;
        // Don't save to localStorage - will show again on next reload
    }

    function closeWelcomePermanent() {
        showWelcome = false;
        if (browser) {
            localStorage.setItem("welcomeDismissed", "permanent");
        }
    }
</script>

<div class="w-full h-screen relative overflow-hidden">
    <Map />

    <!-- Floating Action Button for Reporting -->
    <a
        href="/add"
        class="fixed bottom-8 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-[500] active:scale-90 transition-transform hover:scale-105"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-8 h-8"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>
    </a>

    <!-- Navigation Bar (Glassmorphic) -->
    <div
        class="fixed top-4 left-4 right-4 bg-white/70 backdrop-blur-xl p-2 rounded-full shadow-lg z-[500] flex justify-between items-center px-4 border border-white/40"
    >
        <span class="font-bold text-lg tracking-tight text-gray-900"
            >Njia Salama</span
        >

        <div class="flex items-center gap-3">
            <a
                href="/plan"
                class="text-sm font-medium bg-black/5 hover:bg-black/10 px-4 py-2 rounded-full transition-colors"
            >
                Plan Route
            </a>
            <UserMenu />
        </div>
    </div>

    <!-- Welcome Popup -->
    {#if showWelcome}
        <!-- Backdrop -->
        <div
            transition:fade={{ duration: 200 }}
            class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[900]"
            on:click={closeWelcomeTemporary}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === "Escape" && closeWelcomeTemporary()}
        ></div>

        <!-- Popup -->
        <div
            transition:fly={{ y: 50, duration: 300 }}
            class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-[1000] border border-white/40"
        >
            <!-- Close Button -->
            <button
                on:click={closeWelcomeTemporary}
                class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
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

            <!-- Content -->
            <div class="space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to Njia Salama! 🚴
                    </h2>
                    <p class="text-gray-600">
                        Your safer cycling companion in Kenya
                    </p>
                </div>

                <div class="space-y-4">
                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">🗺️</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                View Hazards
                            </h3>
                            <p class="text-sm text-gray-600">
                                See reported road hazards on the map as orange
                                dots. Click them for details.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">🛣️</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                Plan Safe Routes
                            </h3>
                            <p class="text-sm text-gray-600">
                                Click "Plan Route" to find the safest path
                                between two locations.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">⚠️</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                Report Hazards
                            </h3>
                            <p class="text-sm text-gray-600">
                                Use the + button to report new hazards and help
                                the community.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-4 items-start">
                        <div
                            class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"
                        >
                            <span class="text-xl">💬</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900">
                                Vote & Comment
                            </h3>
                            <p class="text-sm text-gray-600">
                                Keep data accurate by voting if hazards are
                                still there or fixed.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button
                        on:click={closeWelcomeTemporary}
                        class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                    >
                        Close for now
                    </button>
                    <button
                        on:click={closeWelcomePermanent}
                        class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                    >
                        Don't show again
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
