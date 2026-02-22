<!--
@fileoverview Full match scouting display with media, charts, and actions.

@component MatchDisplay

@description
Renders a comprehensive view of a match: videos, contribution chart, comments, checks,
actions, endgame, trace replay, and administrative actions like archiving or restoring
older versions.

@example
```svelte
<MatchDisplay {match} {team} {event} {scouting} strategies={[]} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	// import Trace from './Trace.svelte';
	import { TBAEvent, TBATeam, TBAMatch } from '$lib/utils/tba';
	import { writable } from 'svelte/store';
	import MatchComments from './MatchComments.svelte';
	import Checks from './Checks.svelte';
	import { dateTime } from 'ts-utils/clock';
	import MatchActions from './MatchActions.svelte';
	import MatchEndgame from './MatchEndgame.svelte';
	import { confirm, select } from '$lib/utils/prompts';
	import MatchContribution from '../charts/MatchContribution.svelte';
	import type { Strategy } from '$lib/model/strategy';
	import { goto } from '$app/navigation';
	import Slider from './Slider.svelte';
	import TraceHTML from './TraceHTML.svelte';
	import StrategyGrid from '../strategy/StrategyGrid.svelte';

	interface Props {
		/** TBA match for display and media. */
		match: TBAMatch;
		/** Optional scouting record (may be undefined). */
		scouting?: Scouting.MatchScoutingExtended;
		/** Team being displayed. */
		team: TBATeam;
		// focus: Focus;
		/** Event context for navigation and scoring. */
		event: TBAEvent;
		/** Optional strategies for quick navigation. */
		strategies?: Strategy.StrategyArr;
		/** Optional scout username override. */
		scout?: string;
	}

	const { scouting, team, event, match, strategies, scout }: Props = $props();

	let versions = writable<Scouting.MatchScoutingHistory[]>([]);

	onMount(() => {
		if (scouting) {
			scouting.scouting.getVersions().then((res) => {
				if (res.isErr()) return console.error(res.error);
				versions.set(res.value.data);
			});
		}
	});

	const avgvelocity = () => {
		if (!scouting) return 0;
		return scouting.averageVelocity.toFixed(2);
	};
</script>

<div class="container-fluid">
	{#if scouting}
		<div class="row mb-3">
			<div class="col">
				{#if scout}
					<h4>Scouted by: {scout}</h4>
				{:else}
					<h4>Scouted by: {scouting.scouting.data.scoutUsername}</h4>
				{/if}
			</div>
		</div>
		<div class="row mb-3">
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
		<div class="row mb-3">
			<div class="col-md-6 h-100">
				<div class="card layer-1 h-100">
					<div class="card-body h-100">
						<MatchContribution {match} {scouting} {team} {event} style="height: 321px" />
					</div>
				</div>
				<div class="card h-100">
					<div class="card-body">
						<h5 class="text-center">Stats</h5>
						<h6>Average Velocity: {avgvelocity()} ft/sec</h6>
					</div>
				</div>
			</div>
			<div class="col-md-6 h-100">
				<div class="card layer-1 h-100">
					<div class="card-body h-100">
						<MatchComments {scouting} />
					</div>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-md-3 col-sm-6">
				<div class="card layer-1">
					<div class="card-body">
						<Checks {scouting} />
					</div>
				</div>
			</div>
			<div class="col-md-3 col-sm-6">
				<div class="card layer-1">
					<div class="card-body">
						<MatchActions {scouting} />
					</div>
				</div>
			</div>
			<div class="col-md-3 col-sm-6">
				<div class="card layer-1">
					<MatchEndgame {match} {team} {event} />
				</div>
			</div>
			<div class="col-md-3 col-sm-6">
				<div class="card layer-1">
					<div class="card-body">
						<Slider {scouting} />
					</div>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<TraceHTML {scouting} />
		</div>
		<div class="row mb-3">
			<div class="col-12">
				<div class="btn-group" role="group">
					<button
						class="btn btn-warning"
						type="button"
						onclick={async () => {
							if (
								await confirm(
									'Are you sure you want to archive this scouting data? (It can still be restored)'
								)
							) {
								scouting?.scouting.setArchive(true);
							}
						}}
					>
						<i class="material-icons"> archive </i> Archive Scouting Data
					</button>
					{#if strategies}
						<StrategyGrid {strategies} />
					{/if}
				</div>
			</div>
		</div>
		{#if $versions.length}
			<div class="row mb-3">
				{#each $versions as version}
					<div class="col">
						<div class="card layer-3">
							<div class="card-body">
								{#if version.vhCreated}
									Created: {dateTime(new Date(version.vhCreated))}
								{:else}
									Unknown date
								{/if}
								<TraceHTML {scouting} />
								<button
									type="button"
									class="btn btn-success"
									onclick={async () => {
										if (
											await confirm(
												'Restore this version? This will store the current state as a new version and revert.'
											)
										) {
											version.restore();
										}
									}}
								>
									<i class="material-icons"> update </i>
									Restore Version
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="row mb-3">
			<div class="col-12">
				<div class="card layer-2">
					<div class="card-body">
						<p>No scouting data available</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
