import Uppy from '@uppy/core';
import { attemptAsync } from 'ts-utils/check';

export type sources = Array<
	| 'webcam'
	| 'audio'
	| 'screen-capture'
	| 'url'
	| 'gdrive'
	| 'dropbox'
	| 'instagram'
	| 'facebook'
	| 'onedrive'
	| 'box'
>;

/**
 * Imports Uppy plugins at runtime. Ships only the necessary code to the frontend.
 *
 * @export
 * @param {Uppy} uppy
 * @param {sources} sources
 * @param {string} companionUrl
 * @returns {Uppy}
 */
export async function withDynamicSources(uppy: Uppy, sources: sources, companionUrl: string) {
	// we're going to always allow local
	// if (sources.includes('local')) {
	// 	attemptAsync(async () => {
	// 		await import('@uppy/file-input/css/style.min.css');
	// 		const { default: FileInput } = await import('@uppy/file-input');
	// 		return uppy.use(FileInput);
	// 	}).catch((error) => {
	// 		console.error('Failed to load Uppy FileInput plugin:', error);
	// 	});
	// }

	if (sources.includes('webcam')) {
		attemptAsync(async () => {
			await import('@uppy/webcam/css/style.min.css');
			const { default: Webcam } = await import('@uppy/webcam');
			uppy.use(Webcam);
		}).catch((error) => {
			console.error('Failed to load Uppy Webcam plugin:', error);
		});
	}

	if (sources.includes('audio')) {
		attemptAsync(async () => {
			await import('@uppy/audio/css/style.min.css');
			const { default: Audio } = await import('@uppy/audio');
			uppy.use(Audio);
		}).catch((error) => {
			console.error('Failed to load Uppy Audio plugin:', error);
		});
	}

	if (sources.includes('screen-capture')) {
		attemptAsync(async () => {
			await import('@uppy/screen-capture/css/style.min.css');
			const { default: ScreenCapture } = await import('@uppy/screen-capture');
			uppy.use(ScreenCapture);
		}).catch((error) => {
			console.error('Failed to load Uppy ScreenCapture plugin:', error);
		});
	}

	// Companion sources
	if (sources.includes('url')) {
		attemptAsync(async () => {
			await import('@uppy/url/css/style.min.css');
			const { default: Url } = await import('@uppy/url');
			uppy.use(Url, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy Url plugin:', error);
		});
	}

	if (sources.includes('gdrive')) {
		attemptAsync(async () => {
			const { default: GoogleDrive } = await import('@uppy/google-drive');
			uppy.use(GoogleDrive, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy Google Drive plugin:', error);
		});
	}

	if (sources.includes('dropbox')) {
		attemptAsync(async () => {
			const { default: Dropbox } = await import('@uppy/dropbox');
			uppy.use(Dropbox, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy Dropbox plugin:', error);
		});
	}

	if (sources.includes('instagram')) {
		attemptAsync(async () => {
			const { default: Instagram } = await import('@uppy/instagram');
			uppy.use(Instagram, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy Instagram plugin:', error);
		});
	}

	if (sources.includes('facebook')) {
		attemptAsync(async () => {
			const { default: Facebook } = await import('@uppy/facebook');
			uppy.use(Facebook, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy Facebook plugin:', error);
		});
	}

	if (sources.includes('onedrive')) {
		attemptAsync(async () => {
			const { default: OneDrive } = await import('@uppy/onedrive');
			uppy.use(OneDrive, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy OneDrive plugin:', error);
		});
	}

	if (sources.includes('box')) {
		attemptAsync(async () => {
			const { default: Box } = await import('@uppy/box');
			uppy.use(Box, { companionUrl });
		}).catch((error) => {
			console.error('Failed to load Uppy Box plugin:', error);
		});
	}

	return uppy;
}

/**
 * Conditionally applies an Uppy plugin. Won't ship the code to frontend if it doesn't have to.
 *
 * @export
 * @param {Uppy} uppy
 * @param {string} plugin
 * @param {boolean} condition
 * @returns {Uppy}
 */
export function conditionalUse(uppy: Uppy, plugin: string, condition: boolean) {
	if (condition) {
		attemptAsync(async () => {
			await import(`${plugin}/css/style.min.css`);
			const { default: Plugin } = await import(plugin);
			// @ts-expect-error plugin typing mismatch
			return uppy.use(Plugin);
		}).catch((error) => {
			console.error(`Failed to load Uppy ${plugin} plugin:`, error);
		});
	}

	return uppy;
}
