<script lang="ts">
	import Uppy from '@uppy/core';
	import Dashboard from '@uppy/svelte/dashboard';
	import XHRUpload from '@uppy/xhr-upload';
	import ImageEditor from '@uppy/image-editor';
	import Compressor from '@uppy/compressor';
	import { onMount } from 'svelte';

	// import GoldenRetriever from '@uppy/golden-retriever';
	import { EventEmitter } from 'ts-utils/event-emitter';
	import { z } from 'zod';

	import '@uppy/core/css/style.min.css';
	import '@uppy/dashboard/css/style.min.css';
	import '@uppy/image-editor/css/style.min.css';
	import { error } from '@sveltejs/kit';
	import Modal from '../bootstrap/Modal.svelte';

	const emitter = new EventEmitter<{
		load: string;
		error: string;
	}>();

	// listen to the 'load' event for the picture to be received
	export const on = emitter.on.bind(emitter);

	type sources = Array<
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

	interface Props {
		multiple?: boolean;
		message?: string;
		endpoint: string;
		allowedSources?: sources;
	}

	const {
		multiple = true,
		message = 'Upload Files',
		endpoint,
		allowedSources = ['local', 'webcam']
	}: Props = $props();

	export async function sourcePlugins(uppy: Uppy, allowedSources: sources): Promise<void> {
		if (allowedSources.includes('webcam')) {
			const { default: Webcam } = await import('@uppy/webcam');
			await import('@uppy/webcam/css/style.min.css');
			uppy.use(Webcam);
		}

		if (allowedSources.includes('url')) {
			const { default: Url } = await import('@uppy/url');
			await import('@uppy/url/css/style.min.css');
			uppy.use(Url, { companionUrl: 'https://your-companion.com' });
		}
	}

	let uppy = new Uppy({ debug: true })
		.use(XHRUpload, {
			endpoint,
			onAfterResponse(xhr, retryCount) {
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
		})
		.use(Compressor)
		.use(ImageEditor);

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
					// height: 600,
					autoOpen: 'imageEditor'
				}}
			/>
		</div>
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
