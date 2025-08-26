<script lang="ts">
	import Uppy from '@uppy/core';
	import Dashboard from '@uppy/svelte/dashboard';
	import XHRUpload from '@uppy/xhr-upload';
	import ImageEditor from '@uppy/image-editor';
	import Compressor from '@uppy/compressor';
	import { onMount } from 'svelte';
	import { EventEmitter } from 'ts-utils/event-emitter';
	import { z } from 'zod';

	import '@uppy/core/css/style.min.css';
	import '@uppy/dashboard/css/style.min.css';
	import '@uppy/image-editor/css/style.min.css';
	import { error } from '@sveltejs/kit';
	import Modal from '../bootstrap/Modal.svelte';
	import Dropbox from '@uppy/dropbox';
	import { withDynamicSources, conditionalUse, type sources } from './uppy';

	const emitter = new EventEmitter<{
		load: string;
		error: string;
	}>();

	// listen to the 'load' event for the picture to be received
	export const on = emitter.on.bind(emitter);

	interface Props {
		multiple?: boolean;
		message?: string;
		endpoint: string;
		allowedSources?: sources;
		allowedFileTypes: ['image/*'] | ['*'] | string[];
		editor?: boolean;
		compressor?: boolean;
		local?: boolean;
	}

	const {
		multiple = true,
		message = 'Upload Files',
		endpoint,
		allowedSources = ['webcam'],
		allowedFileTypes = ['*'],
		editor = true,
		compressor = true,
		local = true
	}: Props = $props();
	let uppy: Uppy | null = $state(null);

	onMount(async () => {
		uppy = await withDynamicSources(
			new Uppy({
				debug: false,
				allowMultipleUploads: multiple,
				restrictions: { allowedFileTypes }
			}).use(XHRUpload, {
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
			}),
			allowedSources,
			'https://your-companion.com'
		);

		uppy = conditionalUse(uppy, '@uppy/compressor', compressor);
		uppy = conditionalUse(uppy, '@uppy/image-editor', editor);

		// uppy = uppy.use(Dropbox, { companionUrl: 'https://your-companion.com' });
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
			{#if uppy != null}
				<Dashboard
					{uppy}
					props={{
						theme: 'dark',
						proudlyDisplayPoweredByUppy: false,
						inline: true,
						autoOpen: 'imageEditor',
						disableLocalFiles: !local
					}}
				/>
			{/if}
		</div>
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
