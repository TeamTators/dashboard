<!--
@component
Drive team dashboard for live match planning.

Shows the next match, alliance lineup, and strategy whiteboards.
-->
<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	import { TBAMatch, TBATeam } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import { Loop } from 'ts-utils/loop';
	import { Countdown } from '$lib/utils/countdown.js';
	import { Strategy } from '$lib/model/strategy.js';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import { prompt } from '$lib/utils/prompts.js';
	import StrategyGrid from '$lib/components/strategy/StrategyGrid.svelte';

	const { data } = $props();
	const event = $derived(data.event);
	const teams = $derived(data.teams);

	$effect(() => nav(event.tba));
	let match: TBAMatch | undefined = $state(undefined);
	let tatorAlliance: 'red' | 'blue' | undefined = $state(undefined);
	let strategies = $state(Strategy.Strategy.arr());

	const render = async () => {
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

		strategies = Strategy.Strategy.get(
			{
				eventKey: event.tba.key,
				matchNumber: match.tba.match_number,
				compLevel: match.tba.comp_level
			},
			{
				type: 'all'
			}
		);

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

	let infoModal: Modal;
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
				<div class="col-12">
					<h2>Strategies</h2>
					<button
						type="button"
						class="btn btn-primary"
						onclick={async () => {
							if (!match) return;
							const name = await prompt('Strategy name');
							if (!name) return;
							const res = await Strategy.create({
								match,
								name,
								alliance: tatorAlliance || 'red'
							});
							if (res.isErr()) {
								console.error(res.error);
								alert('Failed to create strategy. Please try again later.');
							} else {
								const strategy = res.value;
								window.location.href = `/dashboard/event/${event.tba.key}/strategy/${strategy.data.id}`;
							}
						}}>Create Strategy</button
					>
					{#if $strategies.length > 0}
						<StrategyGrid {strategies} />
					{:else}
						<p>No strategies created for this match yet.</p>
					{/if}
				</div>
			</div>
		{:else}
			<div class="row mb-3">No match data available.</div>
		{/if}
	</div>
</div>

<Modal bind:this={infoModal} title="Whiteboard Info">
	{#snippet body()}
		<div class="alert alert-info mb-3" style="font-size: 1.1em;">
			<strong>Instructions:</strong><br />
			<ul style="margin-bottom: 0;">
				<li>
					Draw on the field by clicking and dragging (or touching and dragging) on the whiteboard
					area.
				</li>
				<li>Tap or click near a path to select it. The selected path will be highlighted.</li>
				<li>Tap or click a selected path to open options (e.g., delete).</li>
				<li>Use the <b>Undo</b> and <b>Redo</b> buttons to revert or reapply changes.</li>
				<li>
					Use <b>New</b> to create a new whiteboard, or <b>Load</b> to switch between saved boards.
				</li>
			</ul>
		</div>
	{/snippet}
</Modal>

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
</style>
