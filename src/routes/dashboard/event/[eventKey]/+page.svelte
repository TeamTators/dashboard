<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
	import { onMount } from 'svelte';
	import { FIRST } from '$lib/model/FIRST.js';
	import { tomorrow, after } from 'ts-utils/clock';
	import EventSummary from '$lib/components/charts/EventSummary.svelte';
	const { data = $bindable() } = $props();
	const event = $derived(new TBAEvent(data.event));

	let summary:
		| {
				[group: string]: {
					[item: string]: {
						team: number;
						value: number;
					}[];
				};
		  }
		| undefined = $state(undefined);

	let teams: TBATeam[] = $state([]);

	$effect(() => nav(event.tba));

	onMount(() => {
		event
			.getTeams(
				false,
				// tomorrow
				tomorrow()
			)
			.then((res) => {
				if (res.isOk()) {
					teams = res.value;
				}
			});
		setTimeout(() => {
			FIRST.getSummary(event.tba.key, event.tba.year as 2024 | 2025, {
				// 10 minutes
				cacheExpires: after(10 * 60 * 1000)
			}).then((res) => {
				if (res.isOk()) {
					summary = res.value.pivot().teamsRanked();
				} else {
					console.error('Error fetching event summary:', res.error);
				}
			});
		});
	});
</script>

<div class="ws-nowrap scroll-x p-3 mb-3">
	{#each teams as t}
		<a
			type="button"
			href="/dashboard/event/{event.tba.key}/team/{t.tba.team_number}"
			class="btn mx-2 btn-primary"
			data-team={t.tba.team_number}
		>
			{t.tba.team_number}
		</a>
	{/each}
</div>

<div class="container-fluid">
	{#if summary}
		{#each Object.entries(summary) as [group, items]}
			<hr />
			<div class="row mb-3">
				<h3>{group}</h3>
			</div>
			{#each Object.entries(items) as [item, teams]}
				<div class="row mb-3">
					<div class="card layer-2 px-0 mx-0 w-100">
						<div class="card-header">
							<h5 class="card-title mb-0">{item}</h5>
						</div>
						<div class="card-body px-0 mx-0">
							<div class="scroller w-100">
								<div class="chart-container">
									<EventSummary
										datasets={[
											{
												label: 'Teams',
												data: teams.map((t) => t.value)
											}
										]}
										labels={teams.map((t) => String(t.team))}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/each}
	{/if}
</div>

<style>
	.scroller {
		overflow-x: auto;
	}

	.chart-container {
		min-width: 100vw;
		width: 1500px;
		padding: 1rem;
	}
</style>
