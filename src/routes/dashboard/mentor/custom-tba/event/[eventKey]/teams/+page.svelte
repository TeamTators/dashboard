<script lang="ts">
	import { TBAEvent, TBATeam, TBAMatch, get } from '$lib/utils/tba.js';
	import Grid from '$lib/components/general/Grid.svelte';
	import { writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { z } from 'zod';
	import { contextmenu } from '$lib/utils/contextmenu.js';
	import { NumberEditorModule } from 'ag-grid-community';

	const { data } = $props();

	const event = $derived(new TBAEvent(data.event));
	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));

	let editing: number = $state(-1); // index of the currently editing row

	const updateTeams: Writable<
		{
			number: number;
			tba?: TBATeam['tba'];
		}[]
	> = $derived(
		writable(
			teams.map((t) => ({
				number: t.tba.team_number,
				tba: t.tba
			}))
		)
	);

	const save = () => {
		event.setTeams(
			Array.from(
				new Set(
					$updateTeams
						.filter((t) => t.number >= 1) // no team 0s or less
						.filter((t) => t.tba) // only teams with TBA data
						.map((t) => t.number)
				)
			)
		);
	};

	const focus = (index: number) => {
		const g = grid.getGrid();
		g.startEditingCell({
			rowIndex: index,
			colKey: 'number'
		});
	};

	const addTeam = () => {
		updateTeams.update((teams) =>
			[
				...teams,
				{ number: 0, tba: undefined } // Add a new team with number 0 and no TBA data
			].filter((t, i, arr) => arr.findIndex((x) => x.number === t.number) === i)
		); // Remove duplicates
		const g = grid.getGrid();
		g.ensureIndexVisible($updateTeams.length - 1, 'bottom');
		focus($updateTeams.length - 1); // Focus on the new row
	};

	const findTeam = async (teamNumber: number) => {
		const t = await get(
			`/tba/team/frc${teamNumber}`,
			z.object({
				team: z
					.object({
						team_number: z.number(),
						nickname: z.string(),
						key: z.string(),
						name: z.string()
					})
					.optional()
			})
		);
		if (t.isErr()) {
			console.error(`Error finding team ${teamNumber}:`, t.error);
			return undefined;
		} else {
			return t.value.team;
		}
	};

	const keydown = async (event: KeyboardEvent) => {
		if (editing === -1) return;
		switch (event.key) {
			case 'Enter':
				// If the row is the last row, add a new row
				if (editing === $updateTeams.length - 1) {
					addTeam();
				} else {
					// move down to the next row
					focus(editing + 1);
				}
				break;
			case 'ArrowUp':
				// If the row is not the first row, focus on the previous row
				if (editing > 0) {
					focus(editing - 1);
				}
				break;
			case 'ArrowDown':
				// If the row is not the last row, focus on the next row
				if (editing < $updateTeams.length - 1) {
					focus(editing + 1);
				} else {
					// If it is the last row, add a new row
					addTeam();
				}
				break;
		}
	};

	onMount(() => {
		document.addEventListener('keydown', keydown);
		return () => {
			document.removeEventListener('keydown', keydown);
		};
	});

	let grid: Grid<{
		number: number;
		tba?: TBATeam['tba'];
	}>;
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h1>
				Manage Teams for <span class="text-secondary">{event.tba.name} ({$updateTeams.length})</span
				>
			</h1>
			<p class="text-muted">
				Add or edit teams for this event. Teams are not synced with TheBlueAlliance and are only
				available on this instance.
				<br />
				<strong>Note:</strong> Teams must have a valid team number and can be edited to update their
				TBA data. Any duplicates or invalid teams will be ignored when saving. Any update to the team
				number will trigger a save.
			</p>
			<a href="/dashboard/mentor/custom-tba/event/{event.tba.key}" class="btn btn-primary">
				<i class="material-icons">arrow_back</i>
				Back to Event
			</a>

			<a href="/dashboard/mentor/custom-tba/event/{event.tba.key}/matches" class="btn btn-primary">
				<i class="material-icons">list</i>
				Manage Matches
			</a>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<Grid
				bind:this={grid}
				rowNumbers={true}
				modules={[
					NumberEditorModule
				]}
				opts={{
					columnDefs: [
						{
							field: 'number',
							headerName: 'Team Number',
							editable: true,
							cellEditor: 'agNumberCellEditor'
						},
						{
							field: 'tba.nickname',
							headerName: 'Team Name',
							// scale the rest of the way
							flex: 1
						}
					],
					onCellValueChanged: async (event) => {
						event.data.tba = await findTeam(event.data.number);
						updateTeams.update((t) => t);
						save();
					},
					onCellEditingStarted: (event) => (editing = Number(event.rowIndex)),
					onCellEditingStopped: () => (editing = -1),
					onCellContextMenu: (event) => {
						if (!event.event) return;
						event.event.preventDefault();
						console.log(event.event);
						contextmenu(event.event as MouseEvent, {
							options: [
								`Manage ${event.data?.number} (${event.data?.tba?.nickname || 'Unknown'})`,
								null,
								{
									action: async () => {
										window.open(
											`https://www.thebluealliance.com/team/${event.data?.number}`,
											'_blank'
										);
									},
									name: 'Find Team on TBA',
									icon: {
										name: 'open_in_new',
										type: 'material-icons'
									}
								},
								{
									action: () => {
										if (!event.data) return;
										const index = $updateTeams.indexOf(event.data);
										if (index > -1) {
											updateTeams.update((teams) => {
												teams.splice(index, 1);
												return teams;
											});
											save();
										}
									},
									name: 'Delete Team',
									icon: {
										name: 'delete',
										type: 'material-icons'
									}
								}
							]
						});
					},
					preventDefaultOnContextMenu: true
				}}
				data={updateTeams}
				height={400}
			/>
		</div>
	</div>

	<div class="row mb-3">
		<div class="col">
			<button type="button" class="btn btn-primary w-100" onclick={addTeam}>
				<i class="material-icons">add</i>
				Add Team
			</button>
		</div>
	</div>
</div>
