<script>
    import { createEventDispatcher } from "svelte";
    import { addHazard } from "../stores/hazardStore";
    import { user } from "../stores/authStore";

    const dispatch = createEventDispatcher();

    let type = "pothole";
    let severity = 3;
    let comment = "";
    let loading = false;

    const hazardTypes = [
        { id: "pothole", label: "Pothole", icon: "🕳️" },
        { id: "debris", label: "Debris", icon: "🔩" },
        { id: "no_light", label: "No Light", icon: "🌑" },
        { id: "blocked", label: "Blocked", icon: "🚧" },
        { id: "bad_grate", label: "Bad Grate", icon: "⚠️" },
        { id: "other", label: "Other", icon: "❓" },
    ];

    export let location = { lat: -1.2921, lng: 36.8219 }; // Default to Nairobi if not provided

    async function handleSubmit() {
        loading = true;

        const newHazard = {
            hazard_type: type,
            severity_rating: severity,
            location: `POINT(${location.lng} ${location.lat})`, // PostGIS format: POINT(lng lat)
            created_by: $user ? $user.id : null,
            description: comment,
        };

        await addHazard(newHazard);
        loading = false;
        dispatch("close");
    }
</script>

<div
    class="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-4"
>
    <div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
        <h2 class="text-2xl font-bold mb-6">Report Hazard</h2>

        <div class="mb-6">
            <span class="block text-sm font-medium text-gray-700 mb-2"
                >What is it?</span
            >
            <div class="grid grid-cols-3 gap-3">
                {#each hazardTypes as h}
                    <button
                        class="flex flex-col items-center p-3 rounded-xl border-2 transition-all {type ===
                        h.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'}"
                        on:click={() => (type = h.id)}
                        aria-label={h.label}
                    >
                        <span class="text-2xl mb-1">{h.icon}</span>
                        <span class="text-xs font-medium">{h.label}</span>
                    </button>
                {/each}
            </div>
        </div>

        <div class="mb-6">
            <label
                for="severity"
                class="block text-sm font-medium text-gray-700 mb-2"
                >Severity (1-5)</label
            >
            <input
                id="severity"
                type="range"
                min="1"
                max="5"
                bind:value={severity}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>Annoying</span>
                <span>Dangerous</span>
            </div>
        </div>

        <div class="mb-6">
            <label
                for="comment"
                class="block text-sm font-medium text-gray-700 mb-2"
                >Comment (Optional)</label
            >
            <textarea
                id="comment"
                bind:value={comment}
                class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="e.g., Deep hole, hard to see"
            ></textarea>
        </div>

        <div class="flex gap-3">
            <button
                on:click={() => dispatch("close")}
                class="flex-1 py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button
                on:click={handleSubmit}
                disabled={loading}
                class="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? "Submitting..." : "Submit Report"}
            </button>
        </div>
    </div>
</div>
