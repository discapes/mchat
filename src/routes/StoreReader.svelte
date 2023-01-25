<script lang="ts">
	export let store: SvelteStore<any>;

	$: value = $store;
</script>

<slot {value} />
