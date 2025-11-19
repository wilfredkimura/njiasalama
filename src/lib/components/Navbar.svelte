<script>
    import UserMenu from "$lib/components/UserMenu.svelte";
</script>

<div
    class="fixed top-4 left-4 right-4 bg-white/70 backdrop-blur-xl p-2 rounded-full shadow-lg z-[500] flex justify-between items-center px-4 border border-white/40"
>
    <a
        href="/"
        class="font-bold text-lg tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
        >Njia Salama</a
    >

    <div class="flex items-center gap-3">
        <slot />
        <UserMenu />
    </div>
</div>
