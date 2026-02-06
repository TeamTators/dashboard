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
	import { Scouting } from '$lib/model/scouting';
	import { TBATeam } from '$lib/utils/tba.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import RadarChart from '$lib/components/charts/RadarChart.svelte';
	import EventSummary from '$lib/components/robot-display/EventSummary.svelte';
	import ChecksSummary from '$lib/components/robot-display/ChecksSummary.svelte';
	import ActionHeatmap from '$lib/components/robot-display/ActionHeatmap.svelte';
	import { WritableArray } from '$lib/services/writables.js';
	import { page } from '$app/state';

	const { data } = $props();
	const event = $derived(data.event);
	const selectedTeams = $derived(
		new WritableArray<{
			team: TBATeam;
			component: Progress | TeamEventStats | undefined;
			data: Scouting.MatchScoutingExtendedArr;
		}>(
			data.selectedTeams.map((t) => ({
				team: t.team,
				component: undefined,
				data: t.scouting
			}))
		)
	);
	$effect(() => {
		console.log({ selectedTeams });
	});
	const teams = $derived(data.teams);
	const matches = $derived(data.matches);

	$effect(() => nav(event.tba));

	let scroller: HTMLDivElement;
	let staticY = $state(0);

	// view needs to be persistent between reloads, must be in search
	let view: 'progress' | 'radar' | 'stats' | 'eventSum' | 'checkSum' | 'action' = $state(
		(() => {
			const current = page.url.searchParams.get('view') || 'progress';
			if (['progress', 'radar', 'stats', 'eventSum', 'checkSum', 'action'].includes(current)) {
				return current as 'progress' | 'radar' | 'stats' | 'eventSum' | 'checkSum' | 'action';
			}
			return 'progress';
		})()
	);

	const runSearchParams = () => {
		setTimeout(() => {
			const search = new SvelteURLSearchParams(location.search);
			search.set('teams', selectedTeams.data.map((t) => t.team.tba.team_number).join(','));
			search.set('view', view);
			goto(`${location.pathname}?${search.toString()}`);
		});
	};

	const getRadar = (data: Scouting.MatchScoutingExtendedArr): Record<string, number> => {
		const contribution = Scouting.averageContributions(data.data);
		if (contribution.isErr()) return {};
		return contribution.value;
	};

	$effect(() => {
		if (!view) return; // On view set
		staticY = 0;
	});
</script>

<div style="grid-column: span var(--grid-size);">
	<div class="ws-nowrap scroll-x p-3 mb-3" bind:this={scroller}>
		<div class="btn-group" role="group">
			{#each teams as team}
				<input
					type="checkbox"
					class="btn-check"
					id="btn-check-{team.tba.team_number}"
					autocomplete="off"
					checked={!!$selectedTeams.find((t) => t.team.tba.team_number === team.tba.team_number)}
					onchange={async (e) => {
						if (e.currentTarget.checked) {
							const data = Scouting.MatchScoutingExtendedArr.fromArr(
								Scouting.scoutingFromTeam(team.tba.team_number, event.tba.key)
							);
							if (data.isErr()) {
								return console.error('Error parsing data:', data);
							}

							selectedTeams.update((teams) => {
								return [
									...teams,
									{
										team,
										component: undefined,
										data: data.value
									}
								].sort((a, b) => a.team.tba.team_number - b.team.tba.team_number);
							});

							selectedTeams.pipe(data.value);
						} else {
							selectedTeams.remove((t) => t.team.tba.team_number === team.tba.team_number);
						}
						runSearchParams();
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
						onclick={runSearchParams}
					/>
					<label class="btn btn-outline-primary h-min" for="progress-view">Progress</label>
					<input
						type="radio"
						class="btn-check"
						id="stats-view"
						autocomplete="off"
						bind:group={view}
						value="stats"
						onclick={runSearchParams}
					/>
					<label class="btn btn-outline-primary h-min" for="stats-view">Event Stats</label>
					<input
						type="radio"
						class="btn-check"
						id="radar-view"
						autocomplete="off"
						checked
						bind:group={view}
						value="radar"
						onclick={runSearchParams}
					/>
					<label class="btn btn-outline-primary h-min" for="radar-view">Radar Chart</label>
					<input
						type="radio"
						class="btn-check"
						id="eventSum-view"
						autocomplete="off"
						checked
						bind:group={view}
						value="eventSum"
						onclick={runSearchParams}
					/>
					<label class="btn btn-outline-primary h-min" for="eventSum-view">Event Summary</label>
					<input
						type="radio"
						class="btn-check"
						id="checkSum-view"
						autocomplete="off"
						checked
						bind:group={view}
						value="checkSum"
						onclick={runSearchParams}
					/>
					<label class="btn btn-outline-primary h-min" for="checkSum-view">Check Summary</label>
					<input
						type="radio"
						class="btn-check"
						id="action-view"
						autocomplete="off"
						checked
						bind:group={view}
						value="action"
						onclick={runSearchParams}
					/>
					<label class="btn btn-outline-primary h-min" for="action-view">Action Heatmap</label>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			{#each $selectedTeams as team (team.team.tba.team_number)}
				<div class="col-md-4 mb-3">
					<div class="card layer-2 animate__animated animate__zoomIn">
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
								{#if view === 'progress'}
									<Progress
										bind:this={team.component}
										team={team.team}
										{event}
										bind:staticY
										scouting={team.data}
										{matches}
									/>
								{:else if view === 'radar'}
									<RadarChart
										team={team.team}
										data={getRadar(team.data)}
										opts={{
											max: 10,
											min: 0
										}}
									/>
								{:else if view === 'eventSum'}
									<EventSummary {matches} team={team.team} {event} scouting={team.data} />
								{:else if view === 'checkSum'}
									<!-- <ChecksSummary 
									checks={team.data.data.checksSum} /> -->
								{:else if view === 'action'}
									<!-- <ActionHeatmap
										team={team.team}
										scouting={team.data}
									/> -->
								{:else}
									<TeamEventStats
										bind:this={team.component}
										team={team.team}
										{event}
										bind:staticY
										scouting={team.data}
										{matches}
									/>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
