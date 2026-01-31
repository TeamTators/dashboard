<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	import { TBAMatch, TBATeam } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import { Loop } from 'ts-utils/loop';
	import { Countdown } from '$lib/utils/countdown.js';
	import { Whiteboard } from '$lib/services/whiteboard/index.js';
	import { Strategy } from '$lib/model/strategy.js';
	import { alert, prompt, select } from '$lib/utils/prompts.js';
	import { debounce } from 'ts-utils';
	import Modal from '$lib/components/bootstrap/Modal.svelte';

	const { data } = $props();
	const event = $derived(data.event);
	const teams = $derived(data.teams);
	let whiteboards = $state(Strategy.MatchWhiteboards.arr());
	let lastBoardState = '';

	$effect(() => nav(event.tba));
	let match: TBAMatch | undefined = $state(undefined);
	let tatorAlliance: 'red' | 'blue' | undefined = $state(undefined);

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
		countdown.setTarget(new Date(Number(closest.tba.time) * 1000));

		tatorAlliance = match.tba.alliances.red.team_keys.includes('frc2122') ? 'red' : 'blue';

		whiteboards = Strategy.MatchWhiteboards.get(
			{
				eventKey: event.tba.key
			},
			{
				type: 'all'
			}
		);
	};

	const countdown = new Countdown(new Date(2025, 3, 14, 0, 0, 0));
	countdown.start();

	onMount(() => {
		const loop = new Loop(render, 1000 * 60);
		loop.start();

		const offUpdate = Strategy.MatchWhiteboards.on('update', (wb) => {
			if (wb.data.id && currentMatchWhiteboard?.data.id === wb.data.id) {
				if (lastBoardState === wb.data.board) return;
				open(wb);
			}
		});

		return () => {
			loop.stop();
			countdown.stop();
			offUpdate();
			unsub();
			offSave();
		};
	});

	let container: HTMLDivElement;
	let whiteboard: Whiteboard | undefined;
	let whiteboardEl: HTMLDivElement | undefined = $state(undefined);
	let currentMatchWhiteboard: Strategy.MatchWhiteboardData | undefined = $state(undefined);

	let unsub = () => {};
	let offSave = () => {};

	const open = (wb: Strategy.MatchWhiteboardData) => {
		if (!whiteboardEl) return;
		if (!match) return;
		unsub();
		offSave();
		currentMatchWhiteboard = wb;
		whiteboard?.deinit();
		const renderRes = Whiteboard.from(
			{
				target: whiteboardEl,
				event: event.tba,
				match: match.tba
			},
			wb
		);
		if (renderRes.isErr()) {
			return alert('Error loading whiteboard. Contact support.');
		}
		whiteboard = renderRes.value;
		unsub = whiteboard.init();
		offSave = whiteboard.on('update', save);
		for (const p of whiteboard.paths) {
			whiteboard.svg.appendChild(p.target);
			p.draw();
		}
	};

	const save = debounce(() => {
		if (!whiteboard) return;
		if (!match) return;
		if (!currentMatchWhiteboard) return;
		const serialized = whiteboard.serialize();
		lastBoardState = serialized;

		currentMatchWhiteboard.update((d) => ({
			...d,
			board: serialized
		}));
	}, 100);

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
				<div class="col-6">
					<button
						type="button"
						class="btn btn-outline-success w-100"
						onclick={async () => {
							const name = await prompt('Enter a name for the new whiteboard:', {
								default: `Match ${match?.tba.comp_level.toUpperCase()} ${match?.tba.match_number} Whiteboard`
							});
							if (!name) return;
							if (!match) return;

							const onNew = (wb: Strategy.MatchWhiteboardData) => {
								clearTimeout(timeout);
								Strategy.MatchWhiteboards.off('new', onNew);

								open(wb);
							};

							Strategy.MatchWhiteboards.on('new', onNew);

							const timeout = setTimeout(() => {
								Strategy.MatchWhiteboards.off('new', onNew);
								alert('Timed out waiting for whiteboard creation. Please try again.');
							}, 1000 * 10); // 10 seconds

							const res = await Strategy.MatchWhiteboards.new({
								eventKey: event.tba.key,
								matchNumber: match.tba.match_number,
								compLevel: match.tba.comp_level,
								board: JSON.stringify(Whiteboard.blank()),
								name
							});

							if (res.isErr()) {
								return alert('Error creating whiteboard. Please try again.');
							}
						}}
					>
						New <i class="material-icons">add</i>
					</button>
				</div>
				<div class="col-6">
					<button
						type="button"
						disabled={$whiteboards.length === 0}
						class="btn btn-outline-success w-100"
						onclick={async () => {
							if (!match) return;
							if (!whiteboardEl) return;
							const res = await select('Select Whiteboard', whiteboards.data, {
								render: (wb) => `${wb.data.name} (${wb.data.compLevel}${wb.data.matchNumber})`,
								title: 'Load Whiteboard'
							});
							if (res) {
								open(res);
							}
						}}
					>
						Load <i class="material-icons">cached</i> ({$whiteboards.length})
					</button>
				</div>
			</div>
			{#if currentMatchWhiteboard}
				<div class="row mb-3">
					<div class="col py-2 bg-secondary">
						<h5 class="m-0 text-center">
							Loaded: {currentMatchWhiteboard.data.name}
						</h5>
					</div>
				</div>
			{/if}
			<div class="row mb-3">
				<div class="col-md-5 col-4">
					<button
						type="button"
						class="btn btn-outline-secondary w-100"
						onclick={() => whiteboard?.stack.undo()}
					>
						<i class="material-icons">undo</i>
					</button>
				</div>
				<div class="col-md-2 col-4">
					<button
						type="button"
						class="btn btn-info w-100"
						onclick={() => {
							infoModal.show();
						}}
					>
						<i class="material-icons">info</i>
					</button>
				</div>
				<div class="col-md-5 col-4">
					<button
						type="button"
						class="btn btn-outline-secondary w-100"
						onclick={() => whiteboard?.stack.redo()}
					>
						<i class="material-icons">redo</i>
					</button>
				</div>
			</div>
			<div class="row mb-3">
				<div
					style="
					position: relative;
					width: 100%;
					aspect-ratio: 2 / 1;
				"
				>
					<div
						style="
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
					"
					>
						<div
							bind:this={whiteboardEl}
							{@attach (div) => {
								if (!match) return;
								whiteboard = new Whiteboard(
									{
										target: div,
										event: event.tba,
										match: match.tba
									},
									{
										paths: []
									}
								);
								unsub = whiteboard.init();
							}}
						></div>
					</div>
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
