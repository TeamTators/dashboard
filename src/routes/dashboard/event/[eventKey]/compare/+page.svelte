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

	const { data } = $props();
	const event = $derived(data.event);
	const selectedTeams = $derived(data.selectedTeams);
	const teams = $derived(data.teams);
	// const scouting = $derived(data.scouting);
	const teamScouting = $derived(data.teamScouting);
	const matches = $derived(data.matches);

	$effect(() => nav(event.tba));

	let scroller: HTMLDivElement;
	let staticY = $state(0);
	let view: 'progress' | 'stats' = $state('progress');

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	const colors = [
		{ border: 'rgba(255, 99, 132, 1)', background: 'rgba(255, 99, 132, 0.2)' },
		{ border: 'rgba(54, 162, 235, 1)', background: 'rgba(54, 162, 235, 0.2)' },
		{ border: 'rgba(255, 206, 86, 1)', background: 'rgba(255, 206, 86, 0.2)' },
		{ border: 'rgba(75, 192, 192, 1)', background: 'rgba(75, 192, 192, 0.2)' },
		{ border: 'rgba(153, 102, 255, 1)', background: 'rgba(153, 102, 255, 0.2)' },
		{ border: 'rgba(255, 159, 64, 1)', background: 'rgba(255, 159, 64, 0.2)' },
		{ border: 'rgba(199, 199, 199, 1)', background: 'rgba(199, 199, 199, 0.2)' }
	];

	const dataset = $derived(
		selectedTeams.map((team, i) => {
			const color = colors[i % colors.length];
			const scoutingData = teamScouting[i];
			const contribution = Scouting.averageContributions(scoutingData) || 
			{
				cl1: 0, cl2: 0, cl3: 0, cl4: 0, brg: 0, prc: 0
			};

			return {
				label: String(team.tba.team_number),
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
		const search = new URLSearchParams(location.search);
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
	});

	const dashboard = $derived(
		new Dashboard.Dashboard({
			name: event.tba.name + ' Team Comparison',
			cards: [],
			// teams.map(
			// 	(t) =>
			// 		new Dashboard.Card({
			// 			name: t.tba.team_number + ' | ' + t.tba.nickname,
			// 			id: t.tba.team_number.toString(),
			// 			icon: 'mdi:robot',
			// 			size: {
			// 				width: 1,
			// 				height: 1
			// 			},
			// 			iconType: 'material-icons'
			// 		})
			// ),
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
							checked={!!selectedTeams.find((t) => t.tba.team_number === team.tba.team_number)}
							onchange={(event) => {
								if (event.currentTarget.checked) {
									selectedTeams.push(team);
								} else {
									selectedTeams.splice(
										selectedTeams.findIndex((t) => t.tba.team_number === team.tba.team_number),
										1
									);
								}

								selectedTeams.sort((a, b) => a.tba.team_number - b.tba.team_number);

								const search = new URLSearchParams(location.search);
								search.set('teams', selectedTeams.map((t) => t.tba.team_number).join(','));
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
					{#key selectedTeams}
						{#each selectedTeams as team, i}
							<div class="col-md-4 mb-3">
								<div class="card layer-2">
									<div class="card-body">
										<h5 class="card-title">{team.tba.team_number} | {team.tba.nickname}</h5>
										<div style="height: 300px;">
											{#if view === 'progress'}
												<Progress
													{team}
													{event}
													bind:staticY
													scouting={teamScouting[i]}
													{matches}
												/>
											{:else}
												<TeamEventStats
													{team}
													{event}
													bind:staticY
													scouting={teamScouting[i]}
													{matches}
												/>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					{/key}
				</div>
			</div>
		</div>
	{/snippet}
</DB>
