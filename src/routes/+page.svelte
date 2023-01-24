<script lang="ts">
	import { browser } from '$app/environment';
	import Account from './Account.svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/db';
	import type { RealtimeChannel } from '@supabase/realtime-js';
	import Login from './Login.svelte';
	import type { PageData } from './$types';

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
	let channel: RealtimeChannel | null = null;
	let messages = Array<string>();
	export let data: PageData;

	if (browser) {
		const params = new URLSearchParams(location.search);
		const waitingChannel = supabase
			.channel(params.get('channel') ?? 'main')
			.on('broadcast', { event: 'message' }, (m) => (messages = [m.payload.text, ...messages]))
			.subscribe((status) => {
				if (status === 'SUBSCRIBED') channel = waitingChannel;
			});
	}

	async function post(message: string) {
		await channel!.send({
			type: 'broadcast',
			event: 'message',
			payload: { text: message }
		});
		messages = [message, ...messages];
		return true;
	}

	function oneField(handler: (val: string) => Promise<boolean>) {
		return async ({ submitter, target }: SubmitEvent) => {
			const input = (<any>target)['!'];
			const button = <HTMLInputElement>submitter;

			const iVal = input.value;
			const bVal = button.value;

			input.value = '';
			button.value = '...';
			input.disabled = true;
			button.disabled = true;

			const success = await handler(iVal);

			if (!success) input.value = iVal;
			button.value = bVal;
			input.disabled = false;
			button.disabled = false;
			input.focus();
		};
	}
</script>

{#if !data.session}
	<Login />
{:else}
	<div class="flex gap-10">
		<Account session={data.session} />
		{#if channel}
			<div class="form-widget w-[400px] h-[400px]">
				<h2>Chat</h2>
				<form class="flex gap-5" on:submit|preventDefault={oneField(post)}>
					<input required name="!" />
					<input class="button basis-0" value="Send" type="submit" />
				</form>
				<div class="bpad flex flex-col gap-2 overflow-y-auto">
					{#each messages as m}
						<p class="border-b">{m}</p>
					{/each}
				</div>
			</div>
		{:else}
			<div class="form-widget w-[400px] h-[400px]">
				<label>Loading chat...</label>
			</div>
		{/if}
	</div>
{/if}
