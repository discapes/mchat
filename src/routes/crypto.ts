export async function send(message: string, room: string) {
	const roomHash = hash(room);
}

export async function hash(msg: string) {
	const HASH_FUN = 'SHA-256';
	return await crypto.subtle.digest(HASH_FUN, new TextEncoder().encode(msg));
}

export async function encrypt(msg: string, pass: string) {
	const ENCRYPT_ALG = 'AES-CBC';
	const key = await crypto.subtle.importKey('raw', await hash(pass), ENCRYPT_ALG, false, [
		'encrypt'
	]);

	const iv = crypto.getRandomValues(new Uint8Array(16));
	const cipherText = await crypto.subtle.encrypt(
		{
			name: ENCRYPT_ALG,
			iv
		},
		key,
		new TextEncoder().encode(msg)
	);

	return bufferToHex(cipherText) + '-' + bufferToHex(iv);
}

export async function decrypt(emsg: string, pass: string) {
	const ENCRYPT_ALG = 'AES-CBC';
	const key = await crypto.subtle.importKey('raw', await hash(pass), ENCRYPT_ALG, false, [
		'decrypt'
	]);

	const iv = hexToBuffer(emsg.split('-')[1]);
	console.log(iv);
	const cipherText = hexToBuffer(emsg.split('-')[0]);
	const msg = await crypto.subtle.decrypt(
		{
			name: ENCRYPT_ALG,
			iv
		},
		key,
		cipherText
	);

	return new TextDecoder().decode(msg);
}

function bufferToHex(buffer: ArrayBuffer) {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex: string) {
	const intArray = [...hex].reduce((accumulator, _, i, arr) => {
		if (i % 2 === 0) accumulator.push(parseInt(arr[i] + arr[i + 1], 16));
		return accumulator;
	}, [] as number[]);
	return new Uint8Array(intArray);
}
