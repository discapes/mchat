import { supabase } from '$lib/db';
import { exportKey, genRSAEncryptKeys, genRSASignKeys, hashText, importKey } from './crypto';
import { alertAndError } from './utils';

type KeyPairs = {
	signing: CryptoKeyPair;
	encryption: CryptoKeyPair;
};
type PublicKeys = {
	signing: CryptoKey;
	encryption: CryptoKey;
};

export class Identity {
	name: string;
	hash: string;
	keys: KeyPairs;

	constructor(name: string, hash: string, keys: KeyPairs) {
		this.name = name;
		this.hash = hash;
		this.keys = keys;
	}

	async decrypt(data: string) {}
	async sign(data: string) {}

	async toSerializable() {
		return {
			name: this.name,
			hash: this.hash,
			keys: {
				encryption: {
					publicKey: await exportKey(this.keys.encryption.publicKey),
					privateKey: await exportKey(this.keys.encryption.privateKey)
				},
				signing: {
					publicKey: await exportKey(this.keys.signing.publicKey),
					privateKey: await exportKey(this.keys.signing.privateKey)
				}
			}
		};
	}

	static async fromSerializable(
		serial: Awaited<ReturnType<InstanceType<typeof Identity>['toSerializable']>>
	): Promise<Identity> {
		return new Identity(serial.name, serial.hash, {
			encryption: {
				privateKey: await importKey(serial.keys.encryption.privateKey),
				publicKey: await importKey(serial.keys.encryption.publicKey)
			},
			signing: {
				privateKey: await importKey(serial.keys.signing.privateKey),
				publicKey: await importKey(serial.keys.signing.publicKey)
			}
		});
	}
}

export async function registerIdentity(username: string): Promise<Identity | null> {
	// handle reserved
	const usernameHash = await hashText(username);
	const keys = {
		encryption: await genRSAEncryptKeys(),
		signing: await genRSASignKeys()
	};
	const exportedPublicKeys = JSON.stringify({
		encryption: await exportKey(keys.encryption.publicKey),
		signing: await exportKey(keys.signing.publicKey)
	});
	const res = await supabase
		.from('identities')
		.insert({ key: exportedPublicKeys, name: usernameHash });
	if (res.status === 409) return null;
	else if (!(res.status === 201)) alertAndError("Couldn't register name: " + res.error?.message);
	return new Identity(username, usernameHash, keys);
}

export async function getPublicKey(username: string): Promise<PublicKeys | null> {
	const usernameHash = await hashText(username);
	const res = await supabase.from('identities').select('key').limit(1).eq('name', usernameHash);

	const success = res.status === 200;
	if (!success) alertAndError(`Couldn't get key for ${username}:` + res.error?.message);
	if (!res.data?.length) return null;
	const exported = JSON.parse(res.data[0].key);
	return {
		encryption: await importKey(exported.encryption),
		signing: await importKey(exported.signing)
	};
}
