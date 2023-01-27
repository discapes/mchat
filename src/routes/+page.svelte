<script lang="ts">
	import { browser } from '$app/environment';
	import { writable, type Writable } from 'svelte/store';
	import Rooms from './Rooms.svelte';
	import { Identity } from './identities';
	import Identities from './Identities.svelte';

	let allRoomNames: Writable<Set<string> | null> = writable(null);
	let identities: Writable<Set<Identity> | null> = writable(null);
	let currentIdentity: Identity | null;
	$: console.log(currentIdentity);

	if (browser) {
		$allRoomNames = localStorage.getItem('rooms')
			? new Set<string>(JSON.parse(localStorage.getItem('rooms')!))
			: new Set<string>();
		allRoomNames.subscribe(
			(names) => names && localStorage.setItem('rooms', JSON.stringify([...names.values()]))
		);
		if (localStorage.getItem('identities')) {
			Promise.all(
				JSON.parse(localStorage.getItem('identities')!).map((serial: any) =>
					Identity.fromSerializable(serial)
				)
			).then((ids) => ($identities = new Set<Identity>(ids)));
		} else {
			$identities = new Set<Identity>();
		}
		identities.subscribe(
			async (ids) =>
				ids &&
				localStorage.setItem(
					'identities',
					JSON.stringify(await Promise.all([...ids.values()].map((i) => i.toSerializable())))
				)
		);
	}
</script>

<div class="flex gap-10">
	<Rooms {currentIdentity} {allRoomNames} />
	<Identities bind:currentIdentity {identities} />
</div>
