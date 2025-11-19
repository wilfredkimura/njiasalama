<script>
    export let type = "pothole";

    /** @type {Record<string, string>} */
    const icons = {
        pothole: "🕳️",
        debris: "🔩",
        no_light: "🌑",
        blocked: "🚧",
        bad_grate: "⚠️",
        other: "❓",
    };
</script>

<div
    class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500 text-xl"
>
    {icons[type] || icons.other}
</div>
