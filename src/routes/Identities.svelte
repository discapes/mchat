<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { registerIdentity, type Identity } from './identities';
	import { def, oneField } from './utils';

	export let identities: Writable<Set<Identity> | null>;
	export let currentIdentity: Identity | null = null;
	let creatingIdentity = false;

	async function createIdentity(username: string) {
		creatingIdentity = true;
		currentIdentity = null;
		const id = await registerIdentity(username);
		if (!id) {
			alert('Name taken.');
			return;
		}
		identities.update((ids) => ids!.add(id));
		currentIdentity = id;
		creatingIdentity = false;
	}

	function deleteIdentity(id: Identity) {
		if (
			!confirm(
				`Are you absolutely sure you want to forget the identity ${id.name}? It will be permanently unavailable for anyone to use ever again.`
			)
		)
			return;
		identities.update((ids) => (ids?.delete(id), ids));
		if (currentIdentity === id) currentIdentity = null;
	}
</script>

<div class="form-widget w-[200px]">
	{#if $identities}
		<h2 class="flex justify-between">
			Identities <button
				class:hidden={!currentIdentity}
				on:click={() => deleteIdentity(def(currentIdentity))}>🗑️</button
			>
		</h2>
		<div class="rounded-md border overflow-y-auto">
			{#each [...$identities.values()] as identity}
				<button
					on:click={() => (currentIdentity = currentIdentity === identity ? null : identity)}
					class:highlight={currentIdentity === identity}
					class="border-b clickable block w-full"
				>
					{identity.name}
				</button>
			{/each}
			<form class="rowform overflow-hidden" on:submit|preventDefault={oneField(createIdentity)}>
				<input required name="!" placeholder="Username" />
				<input class="button basis-0" value="New" type="submit" />
			</form>
		</div>
		<p class="graytext">You are {currentIdentity?.name ?? 'anonymous'}</p>
		{#if creatingIdentity}
			<p class="graytext">Creating identity...</p>
		{/if}
	{:else}
		<p class="label">Loading identities...</p>
	{/if}
</div>
