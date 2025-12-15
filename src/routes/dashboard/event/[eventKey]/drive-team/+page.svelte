<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { TBAMatch, TBATeam } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import { Loop } from 'ts-utils/loop';
	import { Countdown } from '$lib/utils/countdown.js';

	const { data } = $props();
	const event = $derived(data.event);
	const teams = $derived(data.teams);

	$effect(() => nav(event.tba));
	let match: TBAMatch | undefined = $state(undefined);
	let tatorAlliance: 'red' | 'blue' | undefined = $state(undefined);

	const render = async () => {
		console.log('rendering');
		const matches = await event.getMatches(true, new Date());
		if (matches.isErr()) return console.error(matches.error);

		const now = Date.now(); // in ms

		const closest = matches.value.reduce(
			(prev, curr) => {
				const currTime = Number(curr.tba.time) * 1000;
				if (isNaN(currTime)) return prev;

				if (!prev) {
					return curr;
				}

				const prevTime = Number(prev.tba.time) * 1000;

				const currIsFuture = currTime > now;
				const prevIsFuture = prevTime > now;

				if (currIsFuture && prevIsFuture) {
					return currTime < prevTime ? curr : prev;
				} else if (currIsFuture) {
					return curr;
				} else if (prevIsFuture) {
					return prev;
				}

				// Both are in the past, return the more recent one
				return currTime > prevTime ? curr : prev;
			},
			undefined as TBAMatch | undefined
		);
		if (!closest) return;

		match = closest;
		countdown.setTarget(new Date(Number(closest.tba.time) * 1000));

		tatorAlliance = match.tba.alliances.red.team_keys.includes('frc2122') ? 'red' : 'blue';
	};

	const countdown = new Countdown(new Date(2025, 3, 14, 0, 0, 0));
	countdown.start();

	onMount(() => {
		const loop = new Loop(render, 1000 * 60);
		loop.start();

		return () => {
			loop.stop();
			countdown.stop();
		};
	});

	let container: HTMLDivElement;
</script>

{#snippet renderTeam(position: 1 | 2 | 3, team?: TBATeam)}
	{#if team}
		<div class="card" class:us={team.tba.team_number === 2122}>
			<div class="card-body">
				<div class="d-flex align-items-center justify-content-between">
					<h6>
						Driver Station {position}
					</h6>
					<a
						href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}"
						type="button"
						class="btn"
					>
						<i class="material-icons">visibility</i>
					</a>
				</div>
				<p>
					{team.tba.team_number} | {team.tba.nickname}
				</p>
			</div>
		</div>
	{:else}
		<div class="card">
			<div class="card-body">
				<h5 class="card-title">No Team</h5>
				<p class="card-text">No team data available.</p>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet renderAlliance(alliance: 'red' | 'blue')}
	<div
		class="container-fluid h-100"
		class:red-light={alliance === 'red' && tatorAlliance === 'red'}
		class:blue-light={alliance === 'blue' && tatorAlliance === 'blue'}
		class:red={alliance === 'red'}
		class:blue={alliance === 'blue'}
	>
		<div class="row mb-3">
			{@render renderTeam(
				1,
				teams.find((t) => t.tba.key === match?.tba.alliances[alliance].team_keys[0])
			)}
		</div>
		<div class="row mb-3">
			{@render renderTeam(
				2,
				teams.find((t) => t.tba.key === match?.tba.alliances[alliance].team_keys[1])
			)}
		</div>
		<div class="row mb-3">
			{@render renderTeam(
				3,
				teams.find((t) => t.tba.key === match?.tba.alliances[alliance].team_keys[2])
			)}
		</div>
	</div>
{/snippet}

<div
	bind:this={container}
	style="
        position: relative;
    "
>
	<div class="container-fluid">
		{#if match}
			<div class="row mb-3">
				<div class="col-12">
					<h1 class="text-center">
						Next Match: {match.toString()}
					</h1>
					<h4 class="text-muted text-center">
						{$countdown.string}
					</h4>
				</div>
			</div>
			<div class="row mb-3">
				<div class="col-6">
					{@render renderAlliance('red')}
				</div>
				<div class="col-6">
					{@render renderAlliance('blue')}
				</div>
			</div>
			<div class="row mb-3">
				<div class="position-relative">
					<img
						src="/assets/field/{event.tba.year}.png"
						class="mirror"
						alt=""
						style="
                            width: 100%;
                            aspect-ratio: 2/1;
                            object-fit: cover;
                            object-position: center;
                            top: 0;
                            left: 0;
                            z-index: -1;
                        "
					/>
					<a
						href="/dashboard/event/{event.tba.key}/team/{teams.find(
							(t) => t.tba.key === match?.tba.alliances.blue.team_keys[0]
						)?.tba.team_number}"
						type="button"
						class="btn btn-primary"
						style="
                        position: absolute; 
                        width: min-content;
                        white-space: nowrap;
                        z-index: 10;
                        top: 66%;
                        left: 92%;
                    "
						>Blue 1: {teams.find((t) => t.tba.key === match?.tba.alliances.blue.team_keys[0])?.tba
							.team_number}
					</a>

					<a
						href="/dashboard/event/{event.tba.key}/team/{teams.find(
							(t) => t.tba.key === match?.tba.alliances.blue.team_keys[1]
						)?.tba.team_number}"
						type="button"
						class="btn btn-primary"
						style="
                        position: absolute; 
                        width: min-content;
                        white-space: nowrap;
                        z-index: 10;
                        top: 48%;
                        left: 92%;
                    "
						>Blue 2: {teams.find((t) => t.tba.key === match?.tba.alliances.blue.team_keys[1])?.tba
							.team_number}
					</a>

					<a
						href="/dashboard/event/{event.tba.key}/team/{teams.find(
							(t) => t.tba.key === match?.tba.alliances.blue.team_keys[2]
						)?.tba.team_number}"
						type="button"
						class="btn btn-primary"
						style="
                        position: absolute; 
                        width: min-content;
                        white-space: nowrap;
                        z-index: 10;
                        top: 28%;
                        left: 92%;
                    "
						>Blue 3: {teams.find((t) => t.tba.key === match?.tba.alliances.blue.team_keys[2])?.tba
							.team_number}
					</a>
					<a
						href="/dashboard/event/{event.tba.key}/team/{teams.find(
							(t) => t.tba.key === match?.tba.alliances.red.team_keys[2]
						)?.tba.team_number}"
						type="button"
						class="btn btn-danger"
						style="
                            position: absolute; 
                            width: min-content;
                            white-space: nowrap;
                            z-index: 10;
                            top: 66%;
                            left: 2%;
                        "
						>Red 3: {teams.find((t) => t.tba.key === match?.tba.alliances.red.team_keys[2])?.tba
							.team_number}
					</a>

					<a
						href="/dashboard/event/{event.tba.key}/team/{teams.find(
							(t) => t.tba.key === match?.tba.alliances.red.team_keys[1]
						)?.tba.team_number}"
						type="button"
						class="btn btn-danger"
						style="
                            position: absolute; 
                            width: min-content;
                            white-space: nowrap;
                            z-index: 10;
                            top: 48%;
                            left: 2%;
                        "
						>Red 2: {teams.find((t) => t.tba.key === match?.tba.alliances.red.team_keys[1])?.tba
							.team_number}
					</a>

					<a
						href="/dashboard/event/{event.tba.key}/team/{teams.find(
							(t) => t.tba.key === match?.tba.alliances.red.team_keys[0]
						)?.tba.team_number}"
						type="button"
						class="btn btn-danger"
						style="
                            position: absolute; 
                            width: min-content;
                            white-space: nowrap;
                            z-index: 10;
                            top: 28%;
                            left: 2%;
                        "
						>Red 1: {teams.find((t) => t.tba.key === match?.tba.alliances.red.team_keys[0])?.tba
							.team_number}
					</a>
				</div>
			</div>
		{:else}
			<div class="row mb-3">No match data available.</div>
		{/if}
	</div>
</div>

<style>
	.card {
		background-color: rgba(255, 255, 255, 0.3);
		border: 0;
	}

	.card.us {
		background-color: rgba(255, 255, 255, 0.5);
	}

	.red-light {
		background-color: rgba(255, 0, 0, 0.5) !important;
	}

	.blue-light {
		background-color: rgba(0, 0, 255, 0.5) !important;
	}

	.red {
		background-color: rgba(255, 0, 0, 0.2);
	}

	.blue {
		background-color: rgba(0, 0, 255, 0.2);
	}

	.mirror {
		transform: scaleX(-1);
		transform-origin: center;
	}
</style>
