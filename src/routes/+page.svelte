<script lang="ts">
	import { supabase } from '$lib/db';
	import type { RealtimeChannel } from '@supabase/realtime-js';
	import type { PageData } from './$types';
	import { writable, type Writable } from 'svelte/store';
	import { oneField } from './utils';
	import StoreReader from './StoreReader.svelte';
	import { browser } from '$app/environment';
	import { bufferToHex, decrypt, encrypt, hash, hashText } from './crypto';
	export let data: PageData;

	type Room = {
		name: string;
		channel: Promise<RealtimeChannel>;
		messages: Writable<Array<string>>;
	};

	let rooms: Record<string, Room> = Object.create(null);
	let currentRoom: Room | null = null;

	if (browser) {
		rooms = Object.fromEntries(
			localStorageKeys()
				.filter((key) => key?.startsWith('room-'))
				.map((key) => [key!.slice('room-'.length), localStorage.getItem(key!)])
				.map(([name, messages]) => {
					const room: Room = {
						name: name!,
						messages: writable(JSON.parse(messages!)),
						channel: hashText(name!).then((text) =>
							createChannel(text, (msg) =>
								decrypt(msg, room.name).then(
									(decrypted) => (
										console.log(decrypted), room.messages.update((msgs) => [decrypted, ...msgs])
									)
								)
							)
						)
					};
					room.messages.subscribe((msgs) =>
						localStorage.setItem(`room-${name}`, JSON.stringify(msgs))
					);
					return [name, room];
				})
		);

		function localStorageKeys() {
			return Array(localStorage.length)
				.fill(0)
				.map((_, i) => localStorage.key(i));
		}
	}

	async function createChannel(
		code: string,
		handler: (msg: string) => void
	): Promise<RealtimeChannel> {
		return new Promise((res) => {
			const channel = supabase
				.channel(code)
				.on('broadcast', { event: 'message' }, (f) => handler(f.payload.text))
				.subscribe((status) => {
					if (status === 'SUBSCRIBED') res(channel);
				});
		});
	}

	async function post(room: Room, msg: string) {
		await (
			await room.channel
		).send({
			type: 'broadcast',
			event: 'message',
			payload: { text: await encrypt(msg, room.name) }
		});
		room.messages.update((msgs) => [msg, ...msgs]);
		return true;
	}

	async function newRoom(name: string) {
		const room: Room = {
			name,
			messages: writable([]),
			channel: createChannel(await hashText(name), (msg) =>
				decrypt(msg, room.name).then(
					(decrypted) => (
						console.log(decrypted), room.messages.update((msgs) => [decrypted, ...msgs])
					)
				)
			)
		};
		room.messages.subscribe((msgs) => localStorage.setItem(`room-${name}`, JSON.stringify(msgs)));
		rooms[name] = room;
		currentRoom = room;
		return true;
	}

	function deleteCurrentRoom() {
		const room = currentRoom!;
		room.channel.then((c) => c.unsubscribe);
		delete rooms[room.name];
		rooms = rooms;
		currentRoom = null;
		localStorage.removeItem(`room-${room.name}`);
	}
</script>

<!-- {#if !data.session}
	<Login />
{:else} -->
<div class="flex gap-10">
	<div class="rounded-md border flex w-[800px] h-[400px]">
		<div class="p-5 grow flex flex-col gap-5 basis-full">
			{#if !browser}
				<label>Loading rooms...</label>
			{:else}
				Rooms
				<div class="rounded-md border overflow-y-auto">
					{#each Object.values(rooms) as room}
						<button
							on:click={() => (currentRoom = room)}
							disabled={currentRoom === room}
							class="border-b clickable block w-full"
						>
							{room.name}
						</button>
					{/each}
					<form class="rowform overflow-hidden" on:submit|preventDefault={oneField(newRoom)}>
						<input required name="!" placeholder="Room name" />
						<input class="button basis-0" value="New" type="submit" />
					</form>
				</div>
			{/if}
		</div>
		<div class="border-l" />
		<div class="p-5 basis-full flex flex-col gap-5">
			{#if currentRoom}
				{#await currentRoom.channel}
					<label>Loading chat...</label>
				{:then channel}
					<h2 class="flex justify-between">
						Room {currentRoom.name} <button on:click={deleteCurrentRoom}>🗑️</button>
					</h2>
					<form
						class="rowform border rounded-md basis-initial overflow-hidden"
						on:submit|preventDefault={oneField(post.bind(null, currentRoom))}
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
				{/await}
			{:else}
				<label>Select a room</label>
			{/if}
		</div>
	</div>
</div>
<!-- {/if} -->
