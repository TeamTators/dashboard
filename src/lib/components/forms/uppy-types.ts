import type { Uppy, Meta, PluginOpts, BasePlugin } from '@uppy/core';

export type UppyPlugin = {
	new (
		uppy: Uppy<Meta, Record<string, never>>,
		opts?: PluginOpts
	): BasePlugin<PluginOpts, Meta, Record<string, never>, Record<string, unknown>>;
	prototype: BasePlugin<PluginOpts, Meta, Record<string, never>, Record<string, unknown>>;
};

export type PluginWithOpts<T extends new (...args: any) => any> = {
	Plugin: T;
	PluginOpts: ConstructorParameters<T>[1];
};

export type AnyPlugin = PluginWithOpts<new (...args: any) => any>;
