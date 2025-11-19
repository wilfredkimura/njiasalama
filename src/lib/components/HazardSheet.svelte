<script>
    import { selectedHazard } from "../stores/hazardStore";
    import { fly } from "svelte/transition";
    import { supabase } from "$lib/supabaseClient";

    /** @type {import('../stores/hazardStore').Hazard | null} */
    let hazard = null;
    let reporterName = "Anonymous";

    selectedHazard.subscribe((value) => {
        hazard = value;
        if (hazard && hazard.created_by) {
            fetchReporter(hazard.created_by);
        } else {
            reporterName = "Anonymous";
        }
    });

    /**
     * @param {string} userId
     */
    async function fetchReporter(userId) {
        if (!userId || typeof userId !== "string") return;

        const { data, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", userId)
            .single();

        if (data && data.username) {
            reporterName = data.username;
        } else {
            // Fallback if profile not found but ID exists
            reporterName = "User " + userId.slice(0, 4);
        }
    }

    function close() {
        selectedHazard.set(null);
    }
</script>

{#if hazard}
    <div
        transition:fly={{ y: 200, duration: 300 }}
        class="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-6 z-[1000]"
    >
        <div class="flex justify-between items-start mb-4">
            <div>
                <h2 class="text-2xl font-bold capitalize">
                    {hazard.hazard_type.replace("_", " ")}
                </h2>
                <div class="flex flex-col gap-1 mt-1">
                    <span class="text-sm text-gray-500">
                        Reported by <span class="font-medium text-black"
                            >{reporterName}</span
                        >
                        on {new Date(
                            hazard.created_at || Date.now(),
                        ).toLocaleDateString()}
                    </span>
                    <span
                        class="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium"
                        >Severity: {hazard.severity_rating}/5</span
                    >
                </div>
            </div>
            <button
                on:click={close}
                class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
                ✕
            </button>
        </div>

        <div class="flex gap-4 mb-6">
            <button
                class="flex-1 py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold shadow-sm active:scale-95 transition-transform"
            >
                Still Here?
            </button>
            <button
                class="flex-1 py-3 px-4 bg-green-100 text-green-800 rounded-xl font-semibold shadow-sm active:scale-95 transition-transform"
            >
                Fixed?
            </button>
        </div>

        <div class="border-t pt-4">
            <h3 class="font-semibold mb-2">Comments</h3>
            <p class="text-gray-500 italic text-sm">No comments yet.</p>
        </div>
    </div>
{/if}
