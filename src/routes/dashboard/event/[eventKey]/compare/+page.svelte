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
	import EventSummary from '$lib/components/robot-display/EventSummary.svelte';
	import ChecksSummary from '$lib/components/robot-display/ChecksSummary.svelte';
	import ActionHeatmap from '$lib/components/robot-display/ActionHeatmap.svelte';
	import { WritableArray, WritableBase } from '$lib/services/writables.js';
	import { page } from '$app/state';
	import RadarCapabilityChart from '$lib/components/charts/RadarCapabilityChart.svelte';
	import { compliment } from '$lib/model/match-html';

	type TeamConfig = {
			team: TBATeam;
			component: Progress | TeamEventStats | ActionHeatmap<string> | undefined;
			data: Scouting.MatchScoutingExtendedArr;
	}

	const { data } = $props();
	const event = $derived(data.event);
	const selectedTeams = $derived(
		new WritableArray<TeamConfig>(
			data.selectedTeams.map((t) => ({
				team: t.team,
				component: undefined,
				data: t.scouting
			}))
		)
	);
	const teams = $derived(data.teams);
	const matches = $derived(data.matches);
	const yearActions = new WritableBase<Record<string, {
		name: string;
		color: string;
	}>>({});
	const activeActions = new WritableArray<string>(page.url.searchParams.getAll('actions').filter(Boolean));

	$effect(() => {
		nav(event.tba)
		const res = Scouting.getYearInfo(event.tba.year);
		if (res.isOk()) {
			const colors = compliment(Object.values(res.value.actions).length);
			yearActions.set(Object.fromEntries(Object.entries(res.value.actions).map(([key, value], i) => [
				key,
				{
					name: value,
					color: colors[i].clone().setAlpha(0.5).toString('rgba')
				}
			])))
			console.log(yearActions);
		} else {
			console.log("No year found") // TODO: I dont know what to put here
		}
	});

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
			search.set('actions', activeActions.data.join(','));
			goto(`${location.pathname}?${search.toString()}`);
		});
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
				<h1>Compare Teams: { $selectedTeams.map(t => t.team.tba.team_number).join(', ') }</h1>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-auto">
				<button
					type="button"
					class="btn btn-info"
					onclick={() => {
						copy(location.href, true);
					}}
				>
					<i class="material-icons">share</i>
				</button>
			</div>
			<div class="col-auto">
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
			</div>
			<div class="col-auto">
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
			</div>
			<div class="col-auto">
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
			</div>
			<div class="col-auto">
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
			</div>
			<div class="col-auto">
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
			</div>
			<div class="col-auto">
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
			{#if view === "action"}
		<div class="row mb-3">
				{#each Object.entries($yearActions) as [action, { name, color }]}
				<div class="col-auto">
					<input
						type="checkbox"
						class="btn-check w-100"
						id="btn-check-{action}"
						autocomplete="off"
						checked={$activeActions.includes(action)}
						onchange= {() => {
							activeActions.toggle(action);
							runSearchParams();
						}}
					/>
					<label class="btn me-2 w-100" style="
						background-color: {color};
						color: 'black';
					}}
					" for="btn-check-{action}">{name}</label>
				</div>
				{/each}
		</div>
			{/if}
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
									<RadarCapabilityChart
										team={team.team}
										scouting={team.data}
										year={event.tba.year}
									/>
								{:else if view === 'eventSum'}
									<EventSummary {matches} team={team.team} {event} scouting={team.data} />
								{:else if view === 'checkSum'}
									<ChecksSummary scouting={team.data} />
								{:else if view === 'action'}
									<ActionHeatmap init={(hm) => {
										return activeActions.subscribe((actions) => {
											hm.filter(...actions);
										});
									}} scouting={team.data} year={event.tba.year} doButtons={false}/>
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
