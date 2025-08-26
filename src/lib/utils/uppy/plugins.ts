import type { BasePlugin, Meta, PluginOpts, Uppy, Body } from '@uppy/core';
import Webcam from '@uppy/webcam';
import ImageEditor from '@uppy/image-editor';
import Compressor from '@uppy/compressor';
import Dropbox from '@uppy/dropbox';

// Generic type for an Uppy plugin class constructor
type UppyPluginClass<
	O extends PluginOpts = any,
	M extends Meta = any,
	B extends Body = any,
	PluginState = any
> = new (uppy: Uppy<M, B>, opts?: O) => BasePlugin<O, M, B, PluginState>;

// A helper to extract the options type from a plugin class constructor
type GetPluginOpts<P extends UppyPluginClass> = ConstructorParameters<P>[1];

// Existential type for a plugin configuration entry to allow for a heterogeneous array.
type SomePluginConfigEntry = PluginConfigEntry<UppyPluginClass>;

// A type for an array of plugin configurations
type PluginArr = Array<SomePluginConfigEntry>;

// Change PluginConfigEntry so that opts is always required
type PluginConfigEntry<P extends UppyPluginClass> = {
	Plugin: P;
	opts: GetPluginOpts<P>;
};

export const uppyPlugins: PluginArr = [
	{
		Plugin: Webcam,
		opts: { modes: ['picture'] }
	},
	{
		Plugin: ImageEditor,
		opts: { quality: 0.9, cropperOptions: { viewMode: 1 } }
	},
	{
		Plugin: Compressor,
		opts: { quality: 0.8 }
	},
	{
		Plugin: Dropbox
	}
];
