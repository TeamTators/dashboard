<script lang="ts">
	import Uppy from '@uppy/core';
	import type { BasePlugin, Body, Meta, PluginOpts } from '@uppy/core';
	import Dashboard from '@uppy/svelte/dashboard';
	import XHRUpload from '@uppy/xhr-upload';
	import { EventEmitter } from 'ts-utils/event-emitter';
	import { z } from 'zod';

	import '@uppy/core/css/style.min.css';
	import '@uppy/dashboard/css/style.min.css';
	import '@uppy/image-editor/css/style.min.css';
	import { error } from '@sveltejs/kit';
	import Modal from '../bootstrap/Modal.svelte';
	import Webcam from '@uppy/webcam';

	const emitter = new EventEmitter<{
		load: string;
		error: string;
	}>();

	// listen to the 'load' event for the picture to be received
	export const on = emitter.on.bind(emitter);

	type UppyPlugin = {
		new (
			uppy: Uppy<Meta, Record<string, never>>,
			opts?: PluginOpts
		): BasePlugin<PluginOpts, Meta, Record<string, never>, Record<string, unknown>>;
		prototype: BasePlugin<PluginOpts, Meta, Record<string, never>, Record<string, unknown>>;
	};

	interface Props {
		multiple?: boolean;
		message?: string;
		endpoint: string;
		usage: 'images' | 'general';
		allowLocal?: boolean;
		plugins: UppyPlugin[];
	}

	const {
		multiple = true,
		message = 'Upload Files',
		endpoint,
		usage = 'images',
		allowLocal = true,
		plugins
	}: Props = $props();

	const allowedFileTypes = usage === 'images' ? ['image/*'] : ['*'];

	const uppy = new Uppy({
		debug: false,
		allowMultipleUploads: multiple,
		restrictions: { allowedFileTypes }
	});

	plugins.forEach((p) => uppy.use(p));

	uppy.use(XHRUpload, {
		endpoint,
		onAfterResponse(xhr) {
			console.log(xhr.responseText);

			if (xhr.status >= 200 && xhr.status < 300) {
				emitter.emit(
					'load',
					z
						.object({
							url: z.string()
						})
						.parse(JSON.parse(xhr.responseText)).url
				);
				modal.hide();
			} else {
				console.error(xhr.responseText);
				emitter.emit('error', 'Failed to upload file.');
				error(500, 'Failed to upload file.');
			}
		}
	});

	let modal: Modal;
</script>

<button type="button" class="btn btn-primary" onclick={() => modal.show()}>
	<i class="material-icons">add</i>
	{message}
</button>

<Modal title={message} size="lg" bind:this={modal}>
	{#snippet body()}
		<div class="container-fluid">
			<Dashboard
				{uppy}
				props={{
					theme: 'dark',
					proudlyDisplayPoweredByUppy: false,
					inline: true,
					autoOpen: 'imageEditor',
					disableLocalFiles: !allowLocal
				}}
			/>
		</div>
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
