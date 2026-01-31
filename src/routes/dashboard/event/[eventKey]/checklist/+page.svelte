<script lang="ts">
	import Grid from '$lib/components/general/Grid.svelte';
	import nav from '$lib/nav/robot-display';
	import { readable } from 'svelte/store';
	import { NumberFilterModule, TextFilterModule } from 'ag-grid-community';
	import FileUploader from '$lib/components/forms/FileUploader.svelte';
	import { onMount } from 'svelte';
	import Webcam from '@uppy/webcam';
	import '@uppy/webcam/css/style.min.css';
	import ImageEditor from '@uppy/image-editor';
	import Compressor from '@uppy/compressor';
	import { FIRST } from '$lib/model/FIRST.js';
	import { Account } from '$lib/model/account.js';
	import { contextmenu } from '$lib/utils/contextmenu.js';
	import { MissingPitscoutComp } from '$lib/utils/ag-grid/missing-pitscout.js';

	const { data } = $props();
	const event = $derived(data.event);
	const checklist = $derived(readable(data.data));

	$effect(() => nav(event.tba));

	let uploadTeam: undefined | (typeof $checklist)[number] = $state(undefined);
	let uploadComponent: FileUploader;

	onMount(() => {
		const uppy = uploadComponent.getUppy();
		uppy.use(Webcam, { modes: ['picture'] });
		uppy.use(ImageEditor);
		uppy.use(Compressor, { quality: 0.4 });

		uploadComponent.on('load', (file) => {
			if (!uploadTeam) return;
			FIRST.TeamPictures.new({
				team: uploadTeam.team.tba.team_number,
				eventKey: event.tba.key,
				picture: file,
				accountId: Account.getSelf().data.data.id || ''
			});
		});
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="col">
			<h1>Checklists for {event.tba.name}</h1>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-md-12 col-lg-6">
			<h4>Pictures</h4>
			<Grid
				rowNumbers={true}
				modules={[NumberFilterModule, TextFilterModule]}
				opts={{
					columnDefs: [
						{
							headerName: 'Team',
							field: 'team.tba.team_number',
							filter: 'agTextColumnFilter'
						},
						{
							headerName: 'TBA',
							field: 'tbaPictures',
							filter: 'agNumberColumnFilter'
						},
						{
							headerName: 'Uploaded',
							field: 'uploaded',
							filter: 'agNumberColumnFilter'
						}
					],
					onCellDoubleClicked: async (e) => {
						if (!e.data) return;

						uploadTeam = e.data;
						uploadComponent.show();
					},
					onCellContextMenu: async (e) => {
						if (!e.data) return;
						contextmenu(e.event as MouseEvent, {
							width: '200px',
							options: [
								{
									name: 'Upload Picture',
									icon: {
										type: 'material-icons',
										name: 'add_a_photo'
									},
									action: () => {
										uploadTeam = e.data;
										uploadComponent.show();
									}
								}
							]
						});
					},
					preventDefaultOnContextMenu: true
				}}
				data={checklist}
				height={400}
			/>
		</div>
		<div class="col-md-12 col-lg-6">
			<h4>Pit Scouting</h4>
			<Grid
				rowNumbers={true}
				modules={[TextFilterModule]}
				opts={{
					columnDefs: [
						{
							headerName: 'Team',
							field: 'team.tba.team_number',
							filter: 'agTextColumnFilter'
						},
						{
							headerName: 'Missing',
							// field: "question",
							filter: 'agTextColumnFilter',
							cellRenderer: MissingPitscoutComp,
							width: 300
						}
					]
				}}
				data={checklist}
				height={400}
			/>
		</div>
	</div>
</div>

<FileUploader
	multiple={true}
	message="Upload Pictures"
	allowedFileTypes={['image/*']}
	endpoint="/upload"
	bind:this={uploadComponent}
	btnClasses="d-none"
/>
