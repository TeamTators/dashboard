<script lang="ts">
	import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
	import Grid from '$lib/components/general/Grid.svelte';
	import { writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { capitalize, fromSnakeCase } from 'ts-utils/text';
	import { SearchSelectCellEditor } from '$lib/utils/ag-grid/search-select.js';
	import { type ICellRendererParams, type ValueGetterParams, type ValueSetterParams } from 'ag-grid-community';
	import { match } from 'ts-utils/match';

	const { data } = $props();

	const event = $derived(new TBAEvent(data.event));
	const matches = $derived(data.matches.map((m) => new TBAMatch(m, event)));
	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));

	type Row = {
		red1: number;
		red2: number;
		red3: number;
		blue1: number;
		blue2: number;
		blue3: number;
		number: number;
		compLevel: 'qm' | 'qf' | 'sf' | 'f';
	};

	const updateMatches: Writable<Row[]> = writable(
		data.matches.map((m) => ({
			red1: m.alliances.red.team_keys[0]
				? parseInt(m.alliances.red.team_keys[0].replace('frc', ''))
				: 0,
			red2: m.alliances.red.team_keys[1]
				? parseInt(m.alliances.red.team_keys[1].replace('frc', ''))
				: 0,
			red3: m.alliances.red.team_keys[2]
				? parseInt(m.alliances.red.team_keys[2].replace('frc', ''))
				: 0,
			blue1: m.alliances.blue.team_keys[0]
				? parseInt(m.alliances.blue.team_keys[0].replace('frc', ''))
				: 0,
			blue2: m.alliances.blue.team_keys[1]
				? parseInt(m.alliances.blue.team_keys[1].replace('frc', ''))
				: 0,
			blue3: m.alliances.blue.team_keys[2]
				? parseInt(m.alliances.blue.team_keys[2].replace('frc', ''))
				: 0,
			number: m.match_number,
			compLevel: m.comp_level as 'qm' | 'qf' | 'sf' | 'f'
		}))
	);

	const addMatch = () => {
		updateMatches.update((matches) => [
			...matches,
			{
				red1: 0,
				red2: 0,
				red3: 0,
				blue1: 0,
				blue2: 0,
				blue3: 0,
				number: matches.length + 1, // Increment match number
				compLevel: 'qm' // Default to qualification matches
			}
		]);
	};

	const isTeamValid = (team: number) => {
		return teams.some((t) => t.tba.team_number === team);
	};

	const isMatchValid = (match: {
		red1: number;
		red2: number;
		red3: number;
		blue1: number;
		blue2: number;
		blue3: number;
		number: number;
		compLevel: 'qm' | 'qf' | 'sf' | 'f';
	}) => {
		const teams = [match.red1, match.red2, match.red3, match.blue1, match.blue2, match.blue3];

		// ensure all teams are valid
		for (const team of teams) {
			if (team === 0) {
				return 'not_ready'; // No valid team found
			}
		}
		// ensure no duplicates
		if (new Set(teams).size !== teams.length) {
			return 'duplicate_teams'; // Duplicate teams found
		}

		return 'valid';
	};

	const allTeams = $derived(teams.map((t) => t.tba.team_number));

	onMount(() => {
		addMatch();
	});
</script>

<div class="container-fluid layer-1">
	<div class="row mb-3">
		<div class="col">
			<h1 class="text-center">
				Matches for <span class="text-muted">{event.tba.name} ({matches.length})</span>
			</h1>
		</div>
	</div>

	{#if teams.length}
		<div class="row mb-3">
			<div class="col-12">
				<Grid
					data={updateMatches}
					opts={{
						columnDefs: [
							{
								field: 'compLevel',
								headerName: 'Comp Level',
								width: 110,
								editable: true,
								cellEditor: 'agSelectCellEditor',
								cellEditorParams: {
									values: ['qm', 'qf', 'sf', 'f']
								}
							},
							{
								field: 'number',
								headerName: 'Match Number',
								width: 130,
								editable: true,
								cellEditor: 'agNumberEditor',
							},
							...['red1', 'red2', 'red3', 'blue1', 'blue2', 'blue3'].map((field) => ({
								headerName: field.charAt(0).toUpperCase() + field.slice(1).replace(/\d/, ' $&'),
								valueGetter: (params: ValueGetterParams<Row>) => {
									const match = params.data;
									return match?.[field as keyof typeof match]?.toString() ?? '';
								},
								valueSetter: (params: ValueSetterParams<Row>) => {
									if (!params.node) return false;
									const match = params.data;
									const newValue = parseInt(params.newValue);
									if (isNaN(newValue) || !isTeamValid(newValue)) {
										return false;
									}
									match[field as keyof typeof match] = newValue;
									params.api.refreshCells({ rowNodes: [params.node] });
									return true;
								},
								editable: true,
								cellEditor: SearchSelectCellEditor,
								cellEditorParams: {
									values: allTeams,
									defaultValue: '0'
								},
								width: 75
							})),
							{
								headerName: 'Status',
								cellRenderer: (params: ICellRendererParams) => {
									const m = params.data;
									if (!m) return 'Not Ready';
									const status = isMatchValid(m);
									const text = capitalize(fromSnakeCase(status));
									const icon = match<typeof status, string>(status)
										.case('valid', () => 'check_circle')
										.case('not_ready', () => 'warning')
										.case('duplicate_teams', () => 'error')
										.default(() => 'help')
										.exec()
										.unwrap();
									const color = match<typeof status, string>(status)
										.case('valid', () => 'text-success')
										.case('not_ready', () => 'text-warning')
										.case('duplicate_teams', () => 'text-danger')
										.default(() => 'text-secondary')
										.exec()
										.unwrap();
									return `<span class="${color}"><i class="material-icons">${icon}</i>&nbsp; ${text}</span>`;
								}
							}
						],
						singleClickEdit: true // enables edit on first key press
					}}
					style="height: 400px; width: 100%;"
				/>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col">
				<button type="button" class="btn btn-success w-100" onclick={addMatch}>
					<i class="material-icons">add</i>
					Add Match
				</button>
			</div>
		</div>
	{:else}
		<div class="row mb-3">
			<div class="col-12">
				<div class="alert alert-info text-center">
					<h3>No teams found for this event.</h3>
					<p class="mb-0">You are required to have teams for an event before you create matches.</p>
					<a
						href="/dashboard/mentor/custom-tba/event/{event.tba.key}/teams"
						class="btn btn-primary"
					>
						Manage Teams
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
