<script lang="ts">
	import { FileUploader } from '$lib/utils/files';
	import FileUploaderComponent from '$lib/components/forms/FileUploader.svelte';

	const uploader = new FileUploader('/test/upload', {
		method: 'POST'
	});
</script>

<FileUploaderComponent
	multiple={true}
	message="Drag and drop your files or click here to browse"
	usage="images"
	endpoint="/test/upload"
/>
