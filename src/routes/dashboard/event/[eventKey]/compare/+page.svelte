<!--
@component
Team comparison dashboard for a specific event.

Lets users select teams and compare scouting data with charts.
-->
<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	import { goto } from '$app/navigation';
	import Progress from '$lib/components/charts/Progress.svelte';
	import TeamEventStats from '$lib/components/charts/TeamEventStats.svelte';
	import { copy } from '$lib/utils/clipboard.js';
	import { afterNavigate } from '$app/navigation';
	import { Dashboard } from '$lib/model/dashboard.js';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import Chart from 'chart.js/auto';
	import { Scouting } from '$lib/model/scouting';
	import { writable, get } from 'svelte/store';
	import { TBATeam } from '$lib/utils/tba.js';
	import { Color } from 'colors/color';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const { data } = $props();
	const event = $derived(data.event);
	const selectedTeams = $derived(
		writable<
			{
				team: TBATeam;
				component: Progress | TeamEventStats | undefined;
			}[]
		>(
			data.selectedTeams.map((t) => ({
				team: t,
				component: undefined
			}))
		)
	);
	const teams = $derived(data.teams);
	// const scouting = $derived(data.scouting);
	const teamScouting = $derived(data.teamScouting);
	let teamScoutingData: (Scouting.MatchScoutingExtendedArr | undefined)[] = $state([]);
	const matches = $derived(data.matches);

	$effect(() => nav(event.tba));

	let scroller: HTMLDivElement;
	let staticY = $state(0);
	let view: 'progress' | 'stats' = $state('progress');

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	const colors: {
		border: string;
		background: string;
	}[] = [
		new Color(255, 99, 132),
		new Color(54, 162, 235),
		new Color(75, 192, 192),
		new Color(153, 102, 255),
		new Color(255, 159, 64),
		new Color(199, 199, 199)
	].map((c) => ({
		border: c.clone().setAlpha(1).toString('rgba'),
		background: c.clone().setAlpha(0.2).toString('rgba')
	}));

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
		const search = new SvelteURLSearchParams(location.search);
		search.set('view', view);
		goto(`${location.pathname}?${search.toString()}`);
	});

	afterNavigate(() => {
		teamScoutingData = teamScouting.map((ts) => {
			const res = Scouting.MatchScoutingExtendedArr.fromArr(ts);
			if (res.isOk()) {
				return res.value;
			} else {
				console.error('Failed to parse scouting data for team:', res.error);
				return undefined;
			}
		});

		const search = new SvelteURLSearchParams(location.search);
		view = (search.get('view') as 'progress' | 'stats') || 'progress';

		chartInstance = new Chart(chartCanvas, {
			type: 'radar',
			data: {
				labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Barge', 'Processor'],
				datasets: dataset
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'right'
					}
				},
				scales: {
					r: {
						min: 0,
						max: 10,
						grid: {
							color: 'rgba(60, 60, 60, 1)'
						},
						angleLines: {
							color: 'rgba(60, 60, 60, 1)'
						},
						ticks: {
							color: 'rgba(102, 102, 102, 1)',
							backdropColor: 'rgba(0, 0, 0, 0)'
						}
					}
				}
			}
		});

		const unsub = selectedTeams.subscribe((st) =>
			st.map((team, i) => {
				const color = colors[i % colors.length];
				const scoutingData = teamScoutingData[i];
				if (!scoutingData) {
					return {
						label: String(team.team.tba.team_number),
						data: [0, 0, 0, 0, 0, 0],
						backgroundColor: color.background,
						borderColor: color.border,
						borderWidth: 1,
						pointBackgroundColor: color.background,
						pointBorderColor: color.border
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
					label: String(team.team.tba.team_number),
					data: [
						contribution.cl1,
						contribution.cl2,
						contribution.cl3,
						contribution.cl4,
						contribution.brg,
						contribution.prc
					],
					backgroundColor: color.background,
					borderColor: color.border,
					borderWidth: 1,
					pointBackgroundColor: color.background,
					pointBorderColor: color.border
				};
			})
		);

		return () => {
			unsub();
			chartInstance.destroy();
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

								const search = new SvelteURLSearchParams(location.search);
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
					<div class="col-md-4 mb-3">
						<div class="card layer-2">
							<div class="card-body">
								<h5 class="card-title">Radar Chart</h5>
								<div style="height: 300px;">
									<canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
									<!-- <RadarChart
										{teamScouting} 
										{scouting}
										/>-->
								</div>
							</div>
						</div>
					</div>
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
												<TeamEventStats
													bind:this={team.component}
													team={team.team}
													{event}
													bind:staticY
													scouting={teamScoutingData[i]}
													{matches}
												/>
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
