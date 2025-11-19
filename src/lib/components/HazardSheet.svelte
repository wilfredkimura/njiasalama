<script>
    import { selectedHazard } from "../stores/hazardStore";
    import { user } from "../stores/authStore";
    import { fly } from "svelte/transition";
    import { supabase } from "$lib/supabaseClient";

    /** @type {import('../stores/hazardStore').Hazard | null} */
    let hazard = null;
    let reporterName = "Anonymous";

    let votes = { still_here: 0, fixed: 0 };
    /** @type {string | null} */
    let userVote = null;

    /** @type {any[]} */
    let comments = [];
    let newComment = "";
    let loadingComment = false;

    selectedHazard.subscribe((value) => {
        hazard = value;
        if (hazard) {
            if (hazard.created_by) {
                fetchReporter(hazard.created_by);
            } else {
                reporterName = "Anonymous";
            }
            if (hazard.id) {
                fetchVotes(hazard.id);
                fetchComments(hazard.id);
            }
        } else {
            reporterName = "Anonymous";
            votes = { still_here: 0, fixed: 0 };
            userVote = null;
            comments = [];
            newComment = "";
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

    /**
     * @param {string} hazardId
     */
    async function fetchVotes(hazardId) {
        // Fetch all votes for this hazard
        const { data, error } = await supabase
            .from("hazard_votes")
            .select("vote_type, user_id")
            .eq("hazard_id", hazardId);

        if (data) {
            votes = {
                still_here: data.filter((v) => v.vote_type === "still_here")
                    .length,
                fixed: data.filter((v) => v.vote_type === "fixed").length,
            };

            if ($user && $user.id) {
                const myVote = data.find((v) => v.user_id === $user.id);
                userVote = myVote ? myVote.vote_type : null;
            }
        }
    }

    /**
     * @param {'still_here' | 'fixed'} type
     */
    async function handleVote(type) {
        if (!$user || !$user.id) {
            alert("Please login to vote");
            return;
        }

        if (!hazard || !hazard.id) return;

        // Optimistic update
        userVote = type;
        if (type === "still_here") {
            votes.still_here++;
            if (userVote === "fixed") votes.fixed--;
        } else {
            votes.fixed++;
            if (userVote === "still_here") votes.still_here--;
        }

        const { error } = await supabase.from("hazard_votes").upsert(
            {
                hazard_id: hazard.id,
                user_id: $user.id,
                vote_type: type,
            },
            { onConflict: "hazard_id, user_id" },
        );

        if (error) {
            console.error("Error voting:", error);
            if (hazard?.id) fetchVotes(hazard.id); // Revert/Refresh on error
        } else {
            if (hazard?.id) fetchVotes(hazard.id); // Refresh to be sure
        }
    }

    /**
     * @param {string} hazardId
     */
    async function fetchComments(hazardId) {
        const { data, error } = await supabase
            .from("hazard_comments")
            .select(
                `
                id,
                content,
                created_at,
                user_id,
                profiles!user_id (username)
            `,
            )
            .eq("hazard_id", hazardId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching comments:", error);
        }

        if (data) {
            comments = data;
            console.log("Fetched comments:", data);
        }
    }

    async function submitComment() {
        if (!$user || !$user.id) {
            alert("Please login to comment");
            return;
        }
        if (!newComment.trim()) return;
        if (!hazard || !hazard.id) return;

        loadingComment = true;
        const { error } = await supabase.from("hazard_comments").insert({
            hazard_id: hazard.id,
            user_id: $user.id,
            content: newComment.trim(),
        });

        if (error) {
            console.error("Error commenting:", error);
            alert("Failed to post comment");
        } else {
            newComment = "";
            if (hazard?.id) fetchComments(hazard.id);
        }
        loadingComment = false;
    }

    function close() {
        selectedHazard.set(null);
    }
</script>

{#if hazard}
    <div
        transition:fly={{ y: 200, duration: 300 }}
        class="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-6 z-[1000] max-h-[80vh] overflow-y-auto"
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
                        class="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium w-fit"
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
                on:click={() => handleVote("still_here")}
                class={`flex-1 py-3 px-4 rounded-xl font-semibold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 ${userVote === "still_here" ? "bg-gray-900 text-white ring-2 ring-offset-2 ring-gray-900" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
                <span>Still Here?</span>
                <span class="bg-white/20 px-2 py-0.5 rounded text-xs"
                    >{votes.still_here}</span
                >
            </button>
            <button
                on:click={() => handleVote("fixed")}
                class={`flex-1 py-3 px-4 rounded-xl font-semibold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 ${userVote === "fixed" ? "bg-green-600 text-white ring-2 ring-offset-2 ring-green-600" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
            >
                <span>Fixed?</span>
                <span class="bg-white/20 px-2 py-0.5 rounded text-xs"
                    >{votes.fixed}</span
                >
            </button>
        </div>

        <div class="border-t pt-4">
            <h3 class="font-semibold mb-4">Comments</h3>

            {#if $user}
                <div class="flex gap-2 mb-6">
                    <input
                        type="text"
                        bind:value={newComment}
                        placeholder="Add a comment..."
                        class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        on:keydown={(e) => e.key === "Enter" && submitComment()}
                    />
                    <button
                        on:click={submitComment}
                        disabled={loadingComment || !newComment.trim()}
                        class="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingComment ? "..." : "Post"}
                    </button>
                </div>
            {:else}
                <p
                    class="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg text-center"
                >
                    <a
                        href="/login"
                        class="text-orange-600 font-bold hover:underline"
                        >Login</a
                    > to vote and comment.
                </p>
            {/if}

            <div class="space-y-4">
                {#if comments.length === 0}
                    <p class="text-gray-500 italic text-sm text-center py-4">
                        No comments yet.
                    </p>
                {:else}
                    {#each comments as comment}
                        <div class="bg-gray-50 p-3 rounded-xl">
                            <div class="flex justify-between items-start mb-1">
                                <span class="font-bold text-sm">
                                    {comment.profiles?.username || "Anonymous"}
                                </span>
                                <span class="text-xs text-gray-400">
                                    {new Date(
                                        comment.created_at,
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <p class="text-gray-700 text-sm">
                                {comment.content}
                            </p>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
