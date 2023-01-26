import { decrypt, encrypt, hashText } from './crypto';
import type { Database } from '$lib/types/supabase';
import { supabase } from '$lib/db';
import type { RealtimeChannel } from '@supabase/realtime-js';
import { writable, type Writable } from 'svelte/store';

export type Room = {
	name: string;
	hash: string;
	channel: Promise<RealtimeChannel>;
	messages: Writable<Array<string>>;
};
export type Message = Database['public']['Tables']['messages']['Row'];

async function getMessages(roomName: string, roomHash: string): Promise<string[]> {
	const { data } = await supabase.from('messages').select('message').eq('room', roomHash);
	if (!data) return [];
	else return Promise.all(data.map(f => decrypt(f.message, roomName)));
}

export async function loadRoom(roomName: string): Promise<Room> {
	const roomHash = await hashText(roomName);
	const messages = writable(await getMessages(roomName, roomHash));
	const channel = getChannel(roomHash, msg => 
		decrypt(msg.message, roomName)
		.then(decrypted => messages.update((msgs) => [decrypted, ...msgs])));

	return {
		name: roomName,
		hash: roomHash,
		messages,
		channel
	}
}

export async function post(room: Room, msg: string) {
	const res = await supabase
		.from('messages')
		.insert({ message: await encrypt(msg, room.name), room: room.hash });
	const success = res.status === 201;
	if (!success) alert("Couldn't send message: " + res.statusText);
	return success;
}


async function getChannel(roomHash: string, handler: (msg: Message) => void): Promise<RealtimeChannel> {
	return new Promise((res) => {
		const channel = supabase
			.channel(roomHash)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `room=eq.${roomHash}`
				},
				(payload) => handler(<Message>payload.new)
			)
			.subscribe((status) => {
				if (status === 'SUBSCRIBED') res(channel);
			});
	});
}

