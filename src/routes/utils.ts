
export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// calls handler with value from input "!", after form is submitted
// if handler returns false, the input value is restored back
export function oneField(handler: (val: string) => Promise<boolean>) {
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

		if (!success) input.value = iVal;
		button.value = bVal;
		input.disabled = false;
		button.disabled = false;
		input.focus();
	};
}
