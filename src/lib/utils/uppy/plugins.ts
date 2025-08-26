import Uppy from '@uppy/core';
import BasePlugin from '@uppy/core/lib/Plugin';
import Webcam, { WebcamOptions } from '@uppy/webcam';
import Dropbox, { DropboxOptions } from '@uppy/dropbox';
import ImageEditor, { ImageEditorOptions } from '@uppy/image-editor';

// Helper type: extract second constructor argument
type ConstructorOpts<T extends new (uppy: any, opts?: any) => any> =
	// if the second argument is optional, make it optional in the type
	T extends new (uppy: any, opts: infer O) => any
		? O
		: T extends new (uppy: any, opts?: infer O) => any
			? O | undefined
			: never;

// Plugin config type
type PluginConfig<T extends new (uppy: any, opts?: any) => any> =
	ConstructorOpts<T> extends undefined
		? { Plugin: T } // no opts required
		: { Plugin: T; opts: ConstructorOpts<T> }; // opts required

// Example plugin array
const plugins: Array<
	PluginConfig<typeof Webcam> | PluginConfig<typeof Dropbox> | PluginConfig<typeof ImageEditor>
> = [
	{ Plugin: Webcam, opts: { modes: ['picture'] } }, // required
	{ Plugin: Dropbox, opts: { companionUrl: 'https://companion.uppy.io' } }, // required
	{ Plugin: ImageEditor } // optional opts
];

// Initialize Uppy
const uppy = new Uppy();

// Register plugins dynamically
plugins.forEach(({ Plugin, opts }) => {
	uppy.use(Plugin, opts as any); // TS now knows the correct type for each plugin
});
