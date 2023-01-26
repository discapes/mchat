import { supabase } from '$lib/db';
import { genKeys, hashText } from './crypto';

export async function registerIdentity(username: string): Promise<CryptoKeyPair> {
	const usernameHash = await hashText(username);
	const keys = await genKeys();
	const pk = await crypto.subtle.exportKey('jwk', keys.publicKey);
	const res = await supabase
		.from('identities')
		.insert({ key: JSON.stringify(pk), name: usernameHash });
	const success = res.status === 201;
	if (!success) alert("Couldn't register name: " + res.statusText);
	return keys;
}

export async function getPublicKey(username: string) {
	const usernameHash = await hashText(username);
	const res = await supabase.from("identities").select("key").eq("name", usernameHash);
	// TODO err handling and move to crypto
	const key = await crypto.subtle.importKey("jwk", JSON.parse(res.data[0].key), "RSA-APP", true, ["encrypt", "decrypt", "sign", "verify"]);
	return key;
}