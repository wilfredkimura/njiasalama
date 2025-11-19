<script>
    import { user, signOut } from "../stores/authStore";
    import { supabase } from "$lib/supabaseClient";
    import { onMount } from "svelte";

    let username = "";

    $: if ($user) {
        // Try to get name from metadata first, then profile, then email
        const metaName = $user.user_metadata?.full_name;
        if (metaName) {
            username = metaName;
        } else if ($user.email) {
            username = $user.email.split("@")[0];
        }

        // Optionally fetch profile if needed, but email/metadata is faster for now
    }

    let showMenu = false;
</script>

<div class="relative">
    {#if $user}
        <button
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
            on:click={() => (showMenu = !showMenu)}
        >
            <div
                class="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold"
            >
                {username.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm font-medium hidden sm:block">{username}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 text-gray-500 transition-transform {showMenu
                    ? 'rotate-180'
                    : ''}"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
            </svg>
        </button>

        {#if showMenu}
            <div
                class="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 py-1 z-[2000] origin-top-right"
            >
                <div class="px-4 py-2 border-b border-gray-100">
                    <p class="text-xs text-gray-500">Signed in as</p>
                    <p class="text-sm font-bold truncate">{$user.email}</p>
                </div>
                <button
                    on:click={() => {
                        signOut();
                        showMenu = false;
                    }}
                    class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                    Sign out
                </button>
            </div>

            <!-- Backdrop to close menu -->
            <div
                class="fixed inset-0 z-[1999]"
                on:click={() => (showMenu = false)}
            ></div>
        {/if}
    {:else}
        <a
            href="/login"
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-bold shadow-lg hover:bg-gray-800 transition-transform active:scale-95"
        >
            <span>Login</span>
        </a>
    {/if}
</div>
