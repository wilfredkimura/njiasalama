<script>
    import Map from "$lib/components/Map.svelte";
    import UserMenu from "$lib/components/UserMenu.svelte";
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
</div>
