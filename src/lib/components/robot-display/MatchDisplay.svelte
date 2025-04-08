<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { FIRST } from '$lib/model/FIRST';
	import { onMount } from 'svelte';
	import { MatchCanvas } from '$lib/model/match-canvas';
	import type { Focus } from '$lib/types/robot-display';
	import Trace from './Trace.svelte';
	import { TBAEvent, TBATeam, TBAMatch } from '$lib/utils/tba';
	import { writable } from 'svelte/store';
	import MatchComments from './MatchComments.svelte';
	import Checks from './Checks.svelte';
	import { dateTime } from 'ts-utils/clock';
	import MatchActions from './MatchActions.svelte';
	import MatchEndgame from './MatchEndgame.svelte';
	import { confirm } from '$lib/utils/prompts';

	interface Props {
		match: TBAMatch;
		scouting?: Scouting.MatchScoutingData;
		team: TBATeam;
		// focus: Focus;
		event: TBAEvent;
	}

	const { scouting, team, event, match }: Props = $props();

	let versions = writable<Scouting.MatchScoutingHistory[]>([]);

	onMount(() => {
		if (scouting) {
			scouting.getVersions().then((res) => {
				if (res.isErr()) return console.error(res.error);
				versions.set(res.value);
			});
			console.log(scouting);
		}
	});
</script>

<div class="container-fluid">
	{#if scouting}
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
			<MatchComments {scouting} />
		</div>
		<div class="row mb-3">
			<div class="col-md-4">
				<Checks {scouting} />
			</div>
			<div class="col-md-4">
				<MatchActions {scouting} />
			</div>
			<div class="col-md-4">
				<MatchEndgame {match} {team} {event} />
			</div>
		</div>
		<div class="row mb-3">
			<Trace {scouting} {event} />
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
								scouting?.setArchive(true);
							}
						}}
					>
						<i class="material-icons"> archive </i> Archive Scouting Data
					</button>
				</div>
			</div>
		</div>
		{#if $versions.length}
			<div class="row mb-3">
				{#each $versions as version}
					<div class="card card-body">
						{#if version.vhCreated}
							Created: {dateTime(new Date(version.vhCreated))}
						{:else}
							Unknown date
						{/if}
						<Trace {scouting} {event} />
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
				{/each}
			</div>
		{/if}
	{:else}
		<div class="row mb-3">
			<div class="col-12">
				<div class="card">
					<div class="card-body">
						<p>No scouting data available</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
