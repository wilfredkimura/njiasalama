<script>
    import AddHazardForm from "$lib/components/AddHazardForm.svelte";
    import { goto } from "$app/navigation";

    function close() {
        goto("/");
    }
</script>

<AddHazardForm on:close={close} />
