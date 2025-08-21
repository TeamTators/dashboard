<script lang="ts">
	import Uppy from '@uppy/core';
	import { Dashboard } from '@uppy/svelte';
	import XHRUpload from '@uppy/xhr-upload';
	import ImageEditor from '@uppy/image-editor';
	import Compressor from '@uppy/compressor';
	// import GoldenRetriever from '@uppy/golden-retriever';
	import { EventEmitter } from 'ts-utils/event-emitter';
	import { z } from 'zod';

	import '@uppy/core/dist/style.min.css';
	import '@uppy/dashboard/dist/style.min.css';
	import '@uppy/image-editor/dist/style.min.css';
	import { error } from '@sveltejs/kit';
	import Modal from '../bootstrap/Modal.svelte';

	const emitter = new EventEmitter<{
		load: string;
		error: string;
	}>();

	export const on = emitter.on.bind(emitter);

	interface Props {
		multiple: boolean; // this doesn't actually do anything, i'm unsure how to handle this server-side
		message: string; // this is also not used, but I am unsure what its purpose is.
		endpoint: string;
		buttonText: string;
	}

	const { multiple, message, endpoint, buttonText = 'Upload Files' }: Props = $props();

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
		// golden retriever lets things get temporarily stored in local storage, that way you can upload something on sketchy internet and if it fails halfway through, it will auto recover.
		// has a 5mb limit by default. I'm going to leave this commented out for now because it doesn't like SSR and I'm not sure it's actually a good idea. if someone uploads 15 5mb images that's a lot to cache
		// .use(GoldenRetriever)
		.use(ImageEditor);

	let modal: Modal;
</script>

<button type="button" class="btn btn-primary" onclick={() => modal.show()}>
	<i class="material-icons">add</i>
	{buttonText}
</button>

<Modal title={buttonText} size="lg" bind:this={modal}>
	{#snippet body()}
		<div class="container-fluid">
			<Dashboard
				{uppy}
				props={{
					theme: 'dark',
					proudlyDisplayPoweredByUppy: false,
					inline: true,
					showProgressDetails: true,
					// height: 600,
					autoOpen: 'imageEditor'
				}}
			/>
		</div>
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
