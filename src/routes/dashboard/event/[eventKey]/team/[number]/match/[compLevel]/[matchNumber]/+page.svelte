<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import MatchContribution from '$lib/components/charts/MatchContribution.svelte';
	import MatchDisplay from '$lib/components/robot-display/MatchDisplay.svelte';
	import type { TBAMatch } from '$lib/utils/tba';
	import { onMount } from 'svelte';

	const { data } = $props();
	const event = $derived(data.event);
	const match = $derived(data.match);
	const matches = $derived(data.matches);
	const team = $derived(data.team);
	// const teams = $derived(data.teams);
	const scouting = $derived(data.scouting);

	$effect(() => nav(event.tba));

	let prev: TBAMatch | null = $state(null);
	let next: TBAMatch | null = $state(null);

	$effect(() => {
		const i = matches.findIndex((m) => m.tba.key === match.tba.key);
		if (i > 0) {
			prev = matches[i - 1];
		}
		if (i < matches.length - 1) {
			next = matches[i + 1];
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
	<div class="row mb-3">
		{#if scouting}
			{#key scouting}
				<div class="col-md-6">
					<div class="card h-100">
						<div class="card-body p-1">
							<MatchContribution {match} {scouting} {team} {event} />
						</div>
					</div>
				</div>
			{/key}
		{/if}
		{#each match.tba.videos || [] as video}
			<div class="col-md-6">
				<div class="card h-100">
					<div class="card-body p-1">
						{#if video.type === 'youtube'}
							<iframe
								src="https://www.youtube.com/embed/{video.key}?autoplay=0&controls=1&loop=0&modestbranding=1&rel=0&showinfo=0&color=white&iv_load_policy=3&fs=1&disablekb=1&enablejsapi=1&origin=https%3A%2F%2Fwww.thebluealliance.com&widgetid=1"
								frameborder="0"
								title="YouTube video player"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="w-100 mb-0"
								style="
									height: 200px;
								"
							></iframe>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
	<div class="row">
		{#key scouting}
			<MatchDisplay {scouting} {team} {event} {match} />
		{/key}
	</div>
</div>
