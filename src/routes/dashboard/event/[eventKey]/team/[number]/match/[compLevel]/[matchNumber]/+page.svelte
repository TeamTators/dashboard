<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import MatchDisplay from '$lib/components/robot-display/MatchDisplay.svelte';
	import type { TBAMatch } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import MatchDisplayNoScout from '$lib/components/robot-display/MatchDisplayNoScout.svelte';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { Strategy } from '$lib/model/strategy.js';
	import { Scouting } from '$lib/model/scouting.js';

	const { data } = $props();
	const event = $derived(data.event);
	const match = $derived(data.match);
	const matches = $derived(data.matches);
	const team = $derived(data.team);
	// const teams = $derived(data.teams);
	const scouting = $derived(data.scouting);
	let scoutingData: Scouting.MatchScoutingExtended | undefined = $state(undefined);
	const account = $derived(data.account);

	$effect(() => nav(event.tba));

	let prev: TBAMatch | null = $state(null);
	let next: TBAMatch | null = $state(null);

	let strategies = $state(new DataArr(Strategy.Strategy, []));

	$effect(() => {
		const i = matches.findIndex((m) => m.tba.key === match.tba.key);
		if (i > 0) {
			prev = matches[i - 1];
		}
		if (i < matches.length - 1) {
			next = matches[i + 1];
		}
	});

	onMount(() => {
		strategies = Strategy.fromMatch(
			match.tba.event_key,
			match.tba.match_number,
			match.tba.comp_level
		);

		if (scouting) {
			const res = Scouting.MatchScoutingExtended.from(scouting);
			if (res.isOk()) {
				scoutingData = res.value;
			} else {
				console.error('Failed to parse scouting data:', res.error);
			}
		}
	});
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col-12">
			<h1>{team.tba.nickname} - {event.tba.name} {match.tba.comp_level}{match.tba.match_number}</h1>
			<div class="btn-group" role="group">
				{#if prev}
					<a
						href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}/match/{prev.tba
							.comp_level}/{prev.tba.match_number}"
						class="btn btn-secondary me-2"
					>
						<i class="material-icons"> arrow_back </i>
						Prev
					</a>
				{/if}
				<a
					href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}/traces"
					class="btn btn-primary me-2"
				>
					View all Traces
				</a>
				<a
					href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}"
					class="btn btn-success me-2">View Team</a
				>
				{#if next}
					<a
						href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}/match/{next.tba
							.comp_level}/{next.tba.match_number}"
						class="btn btn-secondary me-2"
					>
						Next
						<i class="material-icons"> arrow_forward </i>
					</a>
				{/if}
			</div>
		</div>
	</div>
	<div class="row">
		{#key scoutingData}
			{#if scoutingData}
				<MatchDisplay
					scouting={scoutingData}
					{team}
					{event}
					{match}
					strategies={$strategies}
					scout={account}
				/>
			{:else}
				<MatchDisplayNoScout {match} {team} {event} strategies={$strategies} />
			{/if}
		{/key}
	</div>
</div>
