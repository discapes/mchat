<script lang="ts">
	import StoreReader from './StoreReader.svelte';
	import { loadRoom, post, type Room } from './rooms';
	import type { Writable } from 'svelte/store';
	import { def, oneField } from './utils';
	import type { Identity } from './identities';

	export let allRoomNames: Writable<Set<string> | null>;
	export let currentIdentity: Identity | null;
	$: console.log(currentIdentity);
	let loadedRooms = new Map<string, Room>();
	let currentRoom: Room | null = null;
	let loadingRoom = false;

	async function setCurrentRoom(roomName: string) {
		currentRoom = null;
		if (loadedRooms.has(roomName)) {
			currentRoom = loadedRooms.get(roomName)!;
		} else {
			loadingRoom = true;
			const room = await loadRoom(roomName);
			loadedRooms.set(roomName, room);
			currentRoom = room;
			loadingRoom = false;
		}
		allRoomNames.update((names) => names!.add(roomName));
	}

	function deleteCurrentRoom() {
		currentRoom!.channel.then((c) => c.unsubscribe());
		loadedRooms.delete(currentRoom!.name);
		allRoomNames.update((names) => (names!.delete(currentRoom!.name), names));
		currentRoom = null;
	}

	function onSend(msg: string) {
		post(def(currentRoom), currentIdentity ? `${currentIdentity.name}: ${msg}` : msg);
		return Promise.resolve();
	}
</script>

<div class="rounded-md border flex h-[400px]">
	<div class="form-widget border-none w-[200px]">
		{#if !$allRoomNames}
			<p class="label">Loading rooms...</p>
		{:else}
			Rooms
			<div class="rounded-md border overflow-y-auto">
				{#each [...$allRoomNames.values()] as roomName}
					<button
						on:click={() => setCurrentRoom(roomName)}
						disabled={currentRoom?.name === roomName}
						class:highlight={currentRoom?.name === roomName}
						class="border-b clickable block w-full"
					>
						{roomName}
					</button>
				{/each}
				<form class="rowform overflow-hidden" on:submit|preventDefault={oneField(setCurrentRoom)}>
					<input required name="!" placeholder="Room name" />
					<input class="button basis-0" value="New" type="submit" />
				</form>
			</div>
		{/if}
	</div>
	<div class="border-l" />
	<div class="form-widget border-none w-[400px]">
		{#if loadingRoom}
			<p class="label">Loading room...</p>
		{:else if currentRoom}
			<h2 class="flex justify-between">
				Room {currentRoom.name} <button on:click={deleteCurrentRoom}>🗑️</button>
			</h2>
			<form
				class="rowform border rounded-md basis-initial shrink-0 overflow-hidden"
				on:submit|preventDefault={oneField(onSend)}
			>
				<input required name="!" placeholder="Message" />
				<input class="button basis-0" value="Send" type="submit" />
			</form>
			<div class="bpad flex flex-col gap-2 overflow-y-auto">
				<StoreReader store={currentRoom.messages} let:value={messages}>
					{#each messages as m}
						<p class="border-b">{m}</p>
					{/each}
				</StoreReader>
			</div>
		{:else}
			<p class="label">Select a room</p>
		{/if}
	</div>
</div>
