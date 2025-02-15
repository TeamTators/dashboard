<script lang="ts">
	import Card from '$lib/components/dashboard/Card.svelte';
	import { Dashboard } from '$lib/model/dashboard';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import { type FilterState } from '$lib/types/robot-display.js';
	import { sleep } from 'ts-utils/sleep';
	import { afterNavigate } from '$app/navigation';
	import PitScoutingCard from '$lib/components/robot-display/pit-scouting/PitScoutingCard.svelte';

	const { data = $bindable() } = $props();
	const teams = $derived(data.teams);
	const team = $derived(data.team);
	const event = $derived(data.event);

	const summary = new Dashboard.Card({
		name: 'Event Summary',
		iconType: 'material-icons',
		icon: 'summarize',
		id: 'card1',
		size: {
			width: 1,
			height: 1
		}
	});

	const comments = new Dashboard.Card({
		name: 'Comments',
		iconType: 'material-icons',
		icon: 'chat',
		id: 'card2',
		size: {
			width: 1,
			height: 2
		}
	});

	const pictures = new Dashboard.Card({
		name: 'Pictures',
		iconType: 'material-icons',
		icon: 'image',
		id: 'card3',
		size: {
			width: 2,
			height: 1
		}
	});

	const actionHeatmap = new Dashboard.Card({
		name: 'Action Heatmap',
		iconType: 'material-icons',
		icon: 'layers',
		id: 'card4',
		size: {
			width: 1,
			height: 1
		}
	});

	const matches = new Dashboard.Card({
		name: 'Matches',
		iconType: 'material-icons',
		icon: 'sports_esports',
		id: 'card5',
		size: {
			width: 1,
			height: 2
		}
	});

	const pitScouting = new Dashboard.Card({
		name: 'Pit Scouting',
		iconType: 'material-icons',
		icon: 'question_answer',
		id: 'card6',
		size: {
			width: 1,
			height: 2
		}
	});

	const matchViewer = new Dashboard.Card({
		name: 'Match Viewer',
		iconType: 'material-icons',
		icon: 'preview',
		id: 'card7',
		size: {
			width: 1,
			height: 1
		}
	});

	const dashboard = $derived(
		new Dashboard.Dashboard({
			name: `Robot Display: ${team.team_number} - ${team.nickname}`,
			cards: [summary, pictures, comments, actionHeatmap, matches, pitScouting, matchViewer],
			id: 'robot-display'
		})
	);

	let filter: FilterState = $state({
		auto: true,
		teleop: true,
		endgame: true
	});

	let scroller: HTMLDivElement;

	afterNavigate(() => {
		const btn = scroller.querySelector(`[data-team="${team.team_number}"]`);
		if (btn) {
			sleep(500).then(() =>
				btn.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'center'
				})
			);
		}
	});
</script>

<DB {dashboard}>
	{#snippet body()}
		<div style="grid-column: span var(--grid-size);">
			<div class="ws-nowrap scroll-x p-3 mb-3" bind:this={scroller}>
				{#each teams as t}
					<a
						type="button"
						href="/dashboard/event/{event.key}/team/{t.team_number}"
						class="btn mx-2"
						class:btn-primary={t.team_number !== team.team_number}
						class:btn-outline-secondary={t.team_number === team.team_number}
						class:btn-disabled={t.team_number === team.team_number}
						class:text-muted={t.team_number === team.team_number}
						onclick={(e) => {
							if (t.team_number === team.team_number) {
								return e.preventDefault();
							}
						}}
						data-team={t.team_number}
					>
						{t.team_number}
					</a>
				{/each}
			</div>
			<div class="btn-group" role="group" aria-label="Basic checkbox toggle button group">
				<input
					type="checkbox"
					class="btn-check"
					id="btncheck1"
					autocomplete="off"
					bind:checked={filter.auto}
				/>
				<label class="btn btn-outline-secondary" for="btncheck1">Auto</label>

				<input
					type="checkbox"
					class="btn-check"
					id="btncheck2"
					autocomplete="off"
					bind:checked={filter.teleop}
				/>
				<label class="btn btn-outline-secondary" for="btncheck2">Teleop</label>

				<input
					type="checkbox"
					class="btn-check"
					id="btncheck3"
					autocomplete="off"
					bind:checked={filter.endgame}
				/>
				<label class="btn btn-outline-secondary" for="btncheck3">Endgame</label>
			</div>
		</div>
		<Card card={summary}>
			{#snippet body()}
				<p>This will be the team summary card</p>
			{/snippet}
		</Card>
		<Card card={pictures}>
			{#snippet body()}
				<p>This will be the pictures card</p>
			{/snippet}
		</Card>
		<Card card={comments}>
			{#snippet body()}
				<p>This will be the comments card</p>
			{/snippet}
		</Card>
		<Card card={actionHeatmap}>
			{#snippet body()}
				<p>This will be the action heatmap card</p>
			{/snippet}
		</Card>
		<Card card={matches}>
			{#snippet body()}
				<p>This will be the matches card</p>
			{/snippet}
		</Card>
		<Card card={pitScouting}>
			{#snippet body()}
				<PitScoutingCard {team} {event} />
			{/snippet}
		</Card>
		<Card card={matchViewer}>
			{#snippet body()}
				<p>This will be the match viewer card</p>
			{/snippet}
		</Card>
	{/snippet}
</DB>

<style>
	.btn-disabled {
		pointer-events: none;
	}
</style>
