<script lang="ts">
	import Card from '$lib/components/dashboard/Card.svelte';
	import { Dashboard } from '$lib/model/dashboard';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import { type Focus } from '$lib/types/robot-display.js';
	import { sleep } from 'ts-utils/sleep';
	import { afterNavigate } from '$app/navigation';
	import ActionHeatmap from '$lib/components/robot-display/ActionHeatmap.svelte';
	import MatchTable from '$lib/components/robot-display/MatchTable.svelte';
	import { Navbar } from '$lib/model/navbar.js';

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
		name: 'Matches',
		iconType: 'material-icons',
		icon: 'preview',
		id: 'card7',
		size: {
			width: 2,
			height: 1
		}
	});

	const dashboard = $derived(
		new Dashboard.Dashboard({
			name: `Robot Display: ${team.tba.team_number} - ${team.tba.nickname}`,
			cards: [summary, pictures, comments, actionHeatmap, pitScouting, matchViewer],
			id: 'robot-display'
		})
	);

	$effect(() => {
		Navbar.addSection({
			name: `${event.tba.name} Dashboard`,
			links: [
				{
					name: `${event.tba.key} Dashboard`,
					href: `/dashboard/event/${event.tba.key}`,
					icon: 'event',
					type: 'material-icons'
				},
				{
					name: `${event.tba.key} Matches`,
					href: `/dashboard/event/${event.tba.key}/matches`,
					icon: 'view_list',
					type: 'material-icons'
				}
			],
			priority: 1
		});
	});

	let focus: Focus = $state({
		auto: true,
		teleop: true,
		endgame: true
	});

	let scroller: HTMLDivElement;

	afterNavigate(() => {
		const btn = scroller.querySelector(`[data-team="${team.tba.team_number}"]`);
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
						href="/dashboard/event/{event.tba.key}/team/{t.tba.team_number}"
						class="btn mx-2"
						class:btn-primary={t.tba.team_number !== team.tba.team_number}
						class:btn-outline-secondary={t.tba.team_number === team.tba.team_number}
						class:btn-disabled={t.tba.team_number === team.tba.team_number}
						class:text-muted={t.tba.team_number === team.tba.team_number}
						onclick={(e) => {
							if (t.tba.team_number === team.tba.team_number) {
								return e.preventDefault();
							}
						}}
						data-team={t.tba.team_number}
					>
						{t.tba.team_number}
					</a>
				{/each}
			</div>
			<div class="btn-group" role="group" aria-label="Basic checkbox toggle button group">
				<input
					type="checkbox"
					class="btn-check"
					id="btncheck1"
					autocomplete="off"
					bind:checked={focus.auto}
				/>
				<label class="btn btn-outline-secondary" for="btncheck1">Auto</label>

				<input
					type="checkbox"
					class="btn-check"
					id="btncheck2"
					autocomplete="off"
					bind:checked={focus.teleop}
				/>
				<label class="btn btn-outline-secondary" for="btncheck2">Teleop</label>

				<input
					type="checkbox"
					class="btn-check"
					id="btncheck3"
					autocomplete="off"
					bind:checked={focus.endgame}
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
				<ActionHeatmap {team} {focus} {event} />
			{/snippet}
		</Card>
		<Card card={pitScouting}>
			{#snippet body()}
				<p>This will be the pit scouting card</p>
			{/snippet}
		</Card>
		<Card card={matchViewer}>
			{#snippet body()}
				<MatchTable {team} {event} />
			{/snippet}
		</Card>
	{/snippet}
</DB>

<style>
	.btn-disabled {
		pointer-events: none;
	}
</style>
