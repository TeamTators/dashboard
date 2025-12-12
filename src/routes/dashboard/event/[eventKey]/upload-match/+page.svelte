<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { loadFileContents } from '$lib/utils/downloads';
	import { WritableArray } from '$lib/utils/writables';
	import z from 'zod';
	import Grid from '$lib/components/general/Grid.svelte';
	import { ButtonCellRenderer } from '$lib/utils/ag-grid/buttons';
	import { type ICellRendererParams } from 'ag-grid-community';
	import nav from '$lib/imports/robot-display.js';

	const { data = $bindable() } = $props();

	const event = $derived(data.event);

	$effect(() => nav(event));

	const matches = new WritableArray<
		Scouting.MatchSchemaType & {
			isError: string;
		}
	>([]);
	let waiting = $state(false);

	const uploadFiles = async () => {
		const fileData = await loadFileContents(true);
		if (fileData.isErr()) {
			alert(`Error loading file: ${fileData.error.message}`);
			return;
		}

		const parsed = z
			.array(Scouting.MatchSchema)
			.safeParse(fileData.value.map((d) => JSON.parse(d.text)));

		if (!parsed.success) {
			alert(`Error parsing file: ${parsed.error.message}`);
			return;
		}

		matches.set(
			parsed.data.map((d) => ({
				...d,
				isError: ''
			}))
		);
	};

	const save = async () => {
		waiting = true;
		const res = await Scouting.uploadMatches(matches.data);
		waiting = false;
		if (res.isErr()) {
			alert(`Error uploading matches: ${res.error.message}`);
			return;
		}
		const toRemove: number[] = [];
		for (let i = 0; i < res.value.length; i++) {
			if (res.value[i].success) {
				toRemove.push(i);
			} else {
				matches.data[i].isError = res.value[i].message || 'Unknown error';
				matches.inform();
			}
		}
		matches.update((arr) => arr.filter((_, index) => !toRemove.includes(index)));
	};
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h2>Upload Match Data</h2>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<button class="btn btn-primary" onclick={uploadFiles}>Load Match Files</button>
			<button type="button" class="btn btn-success" onclick={save}>Save</button>
		</div>
	</div>
	<div class="row mb-3">
		<Grid
			data={matches}
			opts={{
				columnDefs: [
					{
						headerName: 'Actions',
						width: 100,
						cellRenderer: ButtonCellRenderer,
						cellRendererParams: {
							buttons: [
								{
									label: 'Delete',
									onClick: (params: ICellRendererParams<Scouting.MatchSchemaType>) => {
										matches.splice(Number(params.node.rowIndex), 1);
									},
									className: 'btn btn-danger btn-sm',
									title: 'Delete this match entry'
								}
							]
						}
					},
					{
						field: 'eventKey',
						width: 100
					},
					{
						headerName: 'Match',
						width: 100,
						cellRenderer: (params: ICellRendererParams<Scouting.MatchSchemaType>) =>
							`${params.data?.compLevel} ${params.data?.match}`
					},
					{
						field: 'team',
						width: 100
					},
					{
						field: 'scout',
						width: 150
					},
					{
						field: 'isError',
						headerName: 'Error',
						width: 500,
						cellRenderer: (
							params: ICellRendererParams<Scouting.MatchSchemaType & { isError: string }>
						) => (params?.data?.isError ? `❌ Upload Error: ${params.data.isError}` : '')
					}
				]
			}}
			height="80vh"
		/>
	</div>
</div>
{#if waiting}
	<div class="overlay">
		<div class="overlay-text">Loading...</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.overlay-text {
		color: white;
		font-size: 2em;
	}
</style>
