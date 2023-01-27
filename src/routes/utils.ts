export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// calls handler with value from input "!", after form is submitted
// if handler returns false, the input value is restored back
export function oneField(handler: (val: string) => Promise<boolean | void>) {
	return async (event: Event) => {
		const input = <HTMLInputElement>(<any>event.target)['!'];
		const button = <HTMLInputElement>(<SubmitEvent>event).submitter;

		const iVal = input.value;
		const bVal = button.value;

		input.value = '';
		button.value = '...';
		input.disabled = true;
		button.disabled = true;

		const success = await handler(iVal);

		if (success === false) input.value = iVal;
		button.value = bVal;
		input.disabled = false;
		button.disabled = false;
		input.focus();
	};
}

export function alertAndError(message: string) {
	alert(message);
	throw new Error(message);
}

// because sveltekit doesn't allow us to use !
export function def<T>(obj: T): NonNullable<T> {
	return obj!;
}

export async function awaitPromisesIn(obj: any) {
	if (obj && typeof obj.then == 'function') obj = await obj;
	if (!obj || typeof obj != 'object') return obj;
	const forWaiting = Array<Promise<any>>();
	Object.keys(obj).forEach((k) => {
		if (obj[k] && typeof obj[k].then == 'function')
			forWaiting.push(obj[k].then((res: any) => (obj[k] = res)));
		if (obj[k] && typeof obj[k] == 'object') forWaiting.push(awaitPromisesIn(obj[k]));
	});
	await Promise.all(forWaiting);
	return obj;
}
