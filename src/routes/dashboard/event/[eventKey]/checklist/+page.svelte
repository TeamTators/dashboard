<script lang="ts">
	import Grid from '$lib/components/general/Grid.svelte';
	import nav from '$lib/imports/robot-display';
	import { readable } from 'svelte/store';
	import { NumberFilterModule, TextFilterModule } from 'ag-grid-community';
	
	const { data } = $props();
	const event = $derived(data.event);
	const checklist = $derived(readable(data.data));

	$effect(() => nav(event.tba));
	
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h1>Checklists for {event.tba.name}</h1>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
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
					]
				}}
				data={checklist}
				height={400}
			/>
		</div>
		<div class="col">
			<h4>Pit Scouting</h4>
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
					]
				}}
				data={checklist}
				height={400}
			/>
		</div>
	</div>
</div>
