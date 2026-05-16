/**
 * @function callGas
 * @description A helper function to call Google Apps Script functions from the frontend.
 * @param {string} functionName The name of the Google Apps Script function to call.
 * @param {...unknown[]} args The arguments to pass to the Google Apps Script function.
 * @returns {Promise<T>} A promise resolving to the result of the Google Apps Script function.
 */
export function callGas<T>(
	functionName: string,
	...args: unknown[]
): Promise<T> {
	return new Promise((resolve, reject) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const google = (window as any).google;

		if (!google?.script?.run) {
			reject(new Error('google.script.run is not available'));
			return;
		}

		google.script.run
			.withSuccessHandler((result: T) => {
				resolve(result);
			})
			.withFailureHandler((error: Error) => {
				reject(error);
			})[functionName](...args);
	});
}