<script lang="ts">
	import { oneField } from './utils';
	import StoreReader from './StoreReader.svelte';
	import { browser } from '$app/environment';
	import { loadRoom, post, type Room } from './rooms';
	import { writable, type Writable } from 'svelte/store';

	let allRoomNames: Writable<Set<string> | null> = writable(null);
	let loadedRooms = new Map<string, Room>();
	let currentRoom: Room | null = null;
	let loadingRoom = false;

	if (browser) {
		$allRoomNames = localStorage.getItem('rooms')
			? new Set<string>(JSON.parse(localStorage.getItem('rooms')!))
			: new Set<string>();
		allRoomNames.subscribe(
			(names) => names && localStorage.setItem('rooms', JSON.stringify([...names.values()]))
		);
	}

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

	// because sveltekit doesn't allow us to use !
	function def<T>(obj: T): NonNullable<T> {
		return obj!;
	}
</script>

<div class="flex gap-10">
	<div class="rounded-md border flex w-[800px] h-[400px]">
		<div class="p-5 grow flex flex-col gap-5 basis-full">
			{#if !$allRoomNames}
				<label>Loading rooms...</label>
			{:else}
				Rooms
				<div class="rounded-md border overflow-y-auto">
					{#each [...$allRoomNames.values()] as roomName}
						<button
							on:click={() => setCurrentRoom(roomName)}
							disabled={currentRoom?.name === roomName}
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
		<div class="p-5 basis-full flex flex-col gap-5">
			{#if loadingRoom}
				<label>Loading room...</label>
			{:else if currentRoom}
				<h2 class="flex justify-between">
					Room {currentRoom.name} <button on:click={deleteCurrentRoom}>🗑️</button>
				</h2>
				<form
					class="rowform border rounded-md basis-initial shrink-0 overflow-hidden"
					on:submit|preventDefault={oneField((msg) => post(def(currentRoom), msg))}
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
				<label>Select a room</label>
			{/if}
		</div>
	</div>
</div>
