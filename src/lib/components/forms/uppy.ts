import Uppy, { BasePlugin } from '@uppy/core';
import { attempt, attemptAsync } from 'ts-utils/check';

export type sources = Array<
	'local' | 'webcam'
	// the rest of these require Companion. won't enable these until we have that running
	// | 'url'
	// | 'gdrive'
	// | 'dropbox'
	// | 'instagram'
	// | 'facebook'
	// | 'onedrive'
	// | 'box'
>;

type OmitFirstArg<T> = T extends [any, ...infer U] ? U : never;

// Extend Uppy type to include dynamicUse
declare module '@uppy/core' {
	interface Uppy {
		dynamicUse(plugins: string[]): void;
		dynamicSources(sources: sources): void;
	}
}

Uppy.prototype.dynamicUse = function (plugins: string[]) {
	plugins.forEach((plugin) => {
		// Dynamically import and use the plugin
		import(`@uppy/${plugin}`)
			.then((mod) => {
				const PluginClass: typeof BasePlugin = mod.default;
				this.use(PluginClass);
			})
			.catch((error) => {
				console.error(`Failed to load Uppy plugin ${plugin}:`, error);
			});
	});
};

Uppy.prototype.dynamicSources = function (sources: sources) {
	if (sources.includes('webcam')) {
		attemptAsync(async () => {
			await import('@uppy/webcam/css/style.min.css');
			const { default: Webcam } = await import('@uppy/webcam');
			this.use(Webcam);
		}).catch((error) => {
			console.error('Failed to load Uppy Webcam plugin:', error);
		});
	}

	if (sources.includes('ScreenCapture')) {
		attemptAsync(async () => {
			await import('@uppy/screen-capture/css/style.min.css');
			const { default: ScreenCapture } = await import('@uppy/screen-capture');
			this.use(ScreenCapture);
		}).catch((error) => {
			console.error('Failed to load Uppy ScreenCapture plugin:', error);
		});
	}
};

Uppy.prototype.use();
