<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { goto } from '$app/navigation';
	import Progress from '$lib/components/charts/Progress.svelte';
	import TeamEventStats from '$lib/components/charts/TeamEventStats.svelte';
	import { copy } from '$lib/utils/clipboard.js';
	import { onMount } from 'svelte';
	import { Dashboard } from '$lib/model/dashboard.js';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import Chart from 'chart.js/auto';
	import { Scouting } from '$lib/model/scouting';
	import { writable, get } from 'svelte/store';
	import { TBATeam } from '$lib/utils/tba.js';
	import { Color } from 'colors/color';
	import RadarChart from '$lib/components/charts/RadarChart.svelte';

	const { data } = $props();
	const event = $derived(data.event);
	const selectedTeams = writable<
		{
			team: TBATeam;
			component: Progress | TeamEventStats | undefined;
		}[]
	>(
		data.selectedTeams.map((t) => ({
			team: t,
			component: undefined
		}))
	);
	const teams = $derived(data.teams);
	// const scouting = $derived(data.scouting);
	const teamScouting = $derived(data.teamScouting);
	let teamScoutingData: (Scouting.MatchScoutingExtendedArr | undefined)[] = $state([]);
	const matches = $derived(data.matches);
	type RadarData = {
		'Level 1': number;
		'Level 2': number;
		'Level 3': number;
		'Level 4': number;
		Barge: number;
		Processor: number;
	};
	let radarData: RadarData[] = $state([]);

	$effect(() => nav(event.tba));

	let scroller: HTMLDivElement;
	let staticY = $state(0);
	let view: 'progress' | 'radar' | 'stats' = $state('progress');

	const sort = (
		a: {
			team: TBATeam;
		},
		b: {
			team: TBATeam;
		}
	): number => a.team.tba.team_number - b.team.tba.team_number;

	const dataset: {
		label: string;
		data: number[];
		backgroundColor: string;
		borderColor: string;
		borderWidth: number;
		pointBackgroundColor: string;
		pointBorderColor: string;
	}[] = $state([]);

	$effect(() => {
		if (!view) return; // On view set
		staticY = 0;
	});

	$effect(() => {
		// view on search params
		const search = new URLSearchParams(location.search);
		search.set('view', view);
		goto(`${location.pathname}?${search.toString()}`);
	});

	onMount(() => {
		teamScoutingData = teamScouting.map((ts) => {
			const res = Scouting.MatchScoutingExtendedArr.fromArr(ts);
			if (res.isOk()) {
				return res.value;
			} else {
				console.error('Failed to parse scouting data for team:', res.error);
				return undefined;
			}
		});

		const search = new URLSearchParams(location.search);
		view = (search.get('view') as 'progress' | 'radar' | 'stats') || 'progress';

		const unsub = selectedTeams.subscribe((st) =>
			radarData = st.map((team, i) => {
				const scoutingData = teamScoutingData[i];
				if (!scoutingData) {
					return {
						'Level 1': 0,
						'Level 2': 0,
						'Level 3': 0,
						'Level 4': 0,
						Barge: 0,
						Processor: 0
					};
				}
				const contribution = Scouting.averageContributions(scoutingData.data) || {
					cl1: 0,
					cl2: 0,
					cl3: 0,
					cl4: 0,
					brg: 0,
					prc: 0
				};

				return {
					'Level 1': contribution.cl1,
					'Level 2': contribution.cl2,
					'Level 3': contribution.cl3,
					'Level 4': contribution.cl4,
					Barge: contribution.brg,
					Processor: contribution.prc
				};
			})
		);

		return () => {
			unsub();
		};
	});

	const dashboard = $derived(
		new Dashboard.Dashboard({
			name: event.tba.name + ' Team Comparison',
			cards: [],
			id: 'event-dashboard'
		})
	);
</script>

<DB {dashboard}>
	{#snippet body()}
		<div style="grid-column: span var(--grid-size);">
			<div class="ws-nowrap scroll-x p-3 mb-3" bind:this={scroller}>
				<div class="btn-group" role="group">
					{#each teams as team}
						<input
							type="checkbox"
							class="btn-check"
							id="btn-check-{team.tba.team_number}"
							autocomplete="off"
							checked={!!$selectedTeams.find(
								(t) => t.team.tba.team_number === team.tba.team_number
							)}
							onchange={(event) => {
								if (event.currentTarget.checked) {
									selectedTeams.set(
										[
											...get(selectedTeams),
											{
												team,
												component: undefined
											}
										].sort(sort)
									);
								} else {
									selectedTeams.set(
										get(selectedTeams)
											.filter((t) => t.team !== team)
											.sort(sort)
									);
								}

								const search = new URLSearchParams(location.search);
								search.set(
									'teams',
									get(selectedTeams)
										.map((t) => t.team.tba.team_number)
										.join(',')
								);
								goto(`${location.pathname}?${search.toString()}`);
							}}
						/>
						<label class="btn btn-outline-primary me-2" for="btn-check-{team.tba.team_number}">
							{team.tba.team_number}
						</label>
					{/each}
				</div>
			</div>

			<div class="container-fluid">
				<div class="row mb-3">
					<div class="d-flex align-items-center">
						<h1>Compare Teams</h1>
						<div class="btn-group ms-3" role="group" aria-label="View">
							<button
								type="button"
								class="btn btn-info me-3"
								onclick={() => {
									copy(location.href, true);
								}}
							>
								<i class="material-icons">share</i>
							</button>
							<input
								type="radio"
								class="btn-check"
								id="progress-view"
								autocomplete="off"
								checked
								bind:group={view}
								value="progress"
							/>
							<label class="btn btn-outline-primary h-min" for="progress-view">Progress</label>
							<input
								type="radio"
								class="btn-check"
								id="radar-view"
								autocomplete="off"
								checked
								bind:group={view}
								value="radar"
							/>
							<label class="btn btn-outline-primary h-min" for="radar-view">Radar Chart</label>
							<input
								type="radio"
								class="btn-check"
								id="stats-view"
								autocomplete="off"
								bind:group={view}
								value="stats"
							/>
							<label class="btn btn-outline-primary h-min" for="stats-view">Event Stats</label>
						</div>
					</div>
				</div>
				<div class="row mb-3">
					{#each $selectedTeams as team, i}
						<div class="col-md-4 mb-3">
							<div class="card layer-2">
								<div class="card-body">
									<div class="d-flex align-items-center mb-1 justify-content-between">
										<h5 class="card-title">
											{team.team.tba.team_number} | {team.team.tba.nickname}
										</h5>
										<button
											type="button"
											class="btn btn-sm btn-secondary ms-2"
											onclick={() => {
												team.component?.copy(true);
											}}
										>
											<i class="material-icons">copy_all</i>
										</button>
									</div>
									<div style="height: 300px;">
										{#if teamScoutingData[i]}
											{#if view === 'progress'}
												<Progress
													bind:this={team.component}
													team={team.team}
													{event}
													bind:staticY
													scouting={teamScoutingData[i]}
													{matches}
												/>
											{:else}
												{#if view === 'radar'}
													<RadarChart
														team={team.team}
														data={radarData[i]}
														opts={{
															max: 10,
															min: 0
														}}
													/>
												{:else}
													<TeamEventStats
														bind:this={team.component}
														team={team.team}
														{event}
														bind:staticY
														scouting={teamScoutingData[i]}
														{matches}
													/>
												{/if}
											{/if}
										{:else}
											No data found :(
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}
</DB>
