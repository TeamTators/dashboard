<script lang="ts">
	import { Strategy } from '$lib/model/strategy';
	import type { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import Select from '../forms/Select.svelte';
	import Whiteboard from './Whiteboard.svelte';
	import { WritableArray, WritableBase } from '$lib/services/writables';
	import type { Scouting } from '$lib/model/scouting';
	import CombinedTeamContribution from '../charts/CombinedTeamContribution.svelte';
	import RadarCapabilityChart from '../charts/RadarCapabilityChart.svelte';

	interface Props {
		strategy: Strategy.StrategyExtended;
		event: TBAEvent;
		teams: TBATeam[];
	}

	const { strategy, event, teams }: Props = $props();

	const notes = $derived(strategy.notes);
	const name = $derived(strategy.name);
	let edit = $state(false);

	const startingPositions: {
		[year: number]: string[];
	} = {
		2025: ['Left', 'Center', 'Right', 'Other'],
		2026: ['Left', 'Center', 'Right']
	};

	const roles: {
		[year: number]: string[];
	} = {
		2025: ['Coral', 'Algae', 'Other (specify in notes)'],
		2026: ['Finisher', 'Lobber', 'Outpost', 'Dumper', 'Other (specify in notes)']
	};

	let partnerScouting: Scouting.MatchScoutingExtendedArr[] = $state([]);
	let opponentScouting: Scouting.MatchScoutingExtendedArr[] = $state([]);
	const staticY = new WritableBase(0);

	let render = $state(0);
	onMount(() => {
		const partnerResult = strategy.getPartnerScouting();
		if (partnerResult.isErr()) {
			console.error('Error getting partner scouting data:', partnerResult.error);
		} else {
			partnerScouting = partnerResult.value;
		}

		const opponentResult = strategy.getOpponentScouting();
		if (opponentResult.isErr()) {
			console.error('Error getting opponent scouting data:', opponentResult.error);
		} else {
			opponentScouting = opponentResult.value;
		}
		return strategy.subscribe(() => render++);
	});
</script>

{#snippet chart(scouting: Scouting.MatchScoutingExtendedArr, team: TBATeam)}
	<div style="height: 450px;">
		<RadarCapabilityChart {scouting} {team} year={event.tba.year} />
	</div>
{/snippet}

{#snippet editPartner(partner: Strategy.PartnerData, color: 'red' | 'blue')}
	{@const scouting = partnerScouting.find((s) => s.team === partner.data.number)}
	{@const team = teams.find((t) => t.tba.team_number === partner.data.number)}
	<div class="card" class:border-primary={color === 'blue'} class:border-danger={color === 'red'}>
		<div class="card-body layer-3" style="height: 650px; overflow-y: auto;">
			<a
				href="/dashboard/event/{event.tba.key}/team/{partner.data.number}"
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-primary mb-3"
			>
				{partner.data.number} - {team?.tba.nickname ?? 'Unknown Team'}
			</a>
			<div class="container">
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Starting Position</label>
					<Select
						options={startingPositions[event.tba.year]}
						onChange={(i) => {
							partner.update((data) => ({
								...data,
								startingPosition:
									startingPositions[event.tba.year][i] || (i === -1 ? 'other' : undefined)
							}));
						}}
						value={partner.data.startingPosition}
					/>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Primary Role</label>
					<Select
						options={roles[event.tba.year]}
						onChange={(i) =>
							partner.update((data) => ({
								...data,
								role: roles[event.tba.year][i] || (i === -1 ? 'other' : undefined)
							}))}
						value={partner.data.role}
					/>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Notes</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="Notes about this partner"
						value={partner.data.notes}
						onchange={(e) =>
							partner.update((data) => ({
								...data,
								notes: e.currentTarget.value
							}))}
					></textarea>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Auto</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="What this partner does in auto"
						value={partner.data.auto}
						onchange={(e) =>
							partner.update((data) => ({
								...data,
								auto: e.currentTarget.value
							}))}
					></textarea>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Post Auto / Teleop</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="What this partner does after auto"
						value={partner.data.postAuto}
						onchange={(e) =>
							partner.update((data) => ({
								...data,
								postAuto: e.currentTarget.value
							}))}
					></textarea>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Endgame</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="What this partner does in endgame"
						value={partner.data.endgame}
						onchange={(e) =>
							partner.update((data) => ({
								...data,
								endgame: e.currentTarget.value
							}))}
					></textarea>
				</div>
				{#if scouting && team}
					<div class="row mb-3">
						{@render chart(scouting, team)}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet editOpponent(opponent: Strategy.OpponentData, color: 'red' | 'blue')}
	{@const scouting = opponentScouting.find((s) => s.team === opponent.data.number)}
	{@const team = teams.find((t) => t.tba.team_number === opponent.data.number)}
	<div class="card" class:border-primary={color === 'blue'} class:border-danger={color === 'red'}>
		<div class="card-body layer-3" style="height: 650px; overflow-y: auto;">
			<a
				href="/dashboard/event/{event.tba.key}/team/{opponent.data.number}"
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-primary mb-3"
			>
				{opponent.data.number} - {team?.tba.nickname ?? 'Unknown Team'}
			</a>
			<div class="container">
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Role</label>
					<Select
						options={['Primary', 'Secondary', 'Tertiary']}
						onChange={(i) =>
							opponent.update((data) => ({
								...data,
								role: i === -1 ? 'other' : ['primary', 'secondary', 'tertiary'][i]
							}))}
						value={opponent.data.role}
					/>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Notes</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="Notes about this opponent"
						value={opponent.data.notes}
						onchange={(e) =>
							opponent.update((data) => ({
								...data,
								notes: e.currentTarget.value
							}))}
					></textarea>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Auto</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="What this opponent does in auto"
						value={opponent.data.auto}
						onchange={(e) =>
							opponent.update((data) => ({
								...data,
								auto: e.currentTarget.value
							}))}
					></textarea>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Post Auto / Teleop</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="What this opponent does after auto"
						value={opponent.data.postAuto}
						onchange={(e) =>
							opponent.update((data) => ({
								...data,
								postAuto: e.currentTarget.value
							}))}
					></textarea>
				</div>
				<div class="row mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="form-label">Endgame</label>
					<textarea
						class="form-control mb-2"
						rows={3}
						placeholder="What this opponent does in endgame"
						value={opponent.data.endgame}
						onchange={(e) =>
							opponent.update((data) => ({
								...data,
								endgame: e.currentTarget.value
							}))}
					></textarea>
				</div>
				{#if scouting && team}
					<div class="row mb-3">
						{@render chart(scouting, team)}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet showPartner(partner: Strategy.PartnerData, color: 'red' | 'blue')}
	{@const scouting = partnerScouting.find((s) => s.team === partner.data.number)}
	{@const team = teams.find((t) => t.tba.team_number === partner.data.number)}
	<div
		class="card mb-3"
		class:border-primary={color === 'blue'}
		class:border-danger={color === 'red'}
		style="height: 750px"
	>
		<div class="card-body layer-3">
			<a
				href="/dashboard/event/{event.tba.key}/team/{partner.data.number}"
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-primary mb-3"
			>
				{partner.data.number} - {team?.tba.nickname ?? 'Unknown Team'}
			</a>
			<p><strong>Starting Position:</strong> {partner.data.startingPosition}</p>
			<p><strong>Role:</strong> {partner.data.role}</p>
			<p><strong>Notes:</strong> {partner.data.notes}</p>
			<p><strong>Auto:</strong> {partner.data.auto}</p>
			<p><strong>Post Auto / Teleop:</strong> {partner.data.postAuto}</p>
			<p><strong>Endgame:</strong> {partner.data.endgame}</p>
			{#if scouting && team}
				{@render chart(scouting, team)}
			{/if}
		</div>
	</div>
{/snippet}

{#snippet showOpponent(opponent: Strategy.OpponentData, color: 'red' | 'blue')}
	{@const scouting = opponentScouting.find((s) => s.team === opponent.data.number)}
	{@const team = teams.find((t) => t.tba.team_number === opponent.data.number)}
	<div
		class="card mb-3"
		class:border-primary={color === 'blue'}
		class:border-danger={color === 'red'}
		style="height: 750px"
	>
		<div class="card-body layer-3">
			<a
				href="/dashboard/event/{event.tba.key}/team/{opponent.data.number}"
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-primary mb-3"
			>
				{opponent.data.number} - {team?.tba.nickname ?? 'Unknown Team'}
			</a>
			<p><strong>Role:</strong> {opponent.data.role}</p>
			<p><strong>Notes:</strong> {opponent.data.notes}</p>
			<p><strong>Auto:</strong> {opponent.data.auto}</p>
			<p><strong>Post Auto / Teleop:</strong> {opponent.data.postAuto}</p>
			<p><strong>Endgame:</strong> {opponent.data.endgame}</p>
			{#if scouting && team}
				{@render chart(scouting, team)}
			{/if}
		</div>
	</div>
{/snippet}

<div class="container-fluid layer-1">
	<div class="row mb-3">
		<div class="container">
			<div class="row mb-3">
				<h1>
					Strategy {edit ? '(Editing)' : ''} - {event.tba.name}
				</h1>
			</div>
			<div class="row mb-3">
				<div class="col-8 mb-3">
					{#if edit}
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="form-label">Strategy Name</label>
						<input
							type="text"
							class="form-control mb-2"
							value={$name}
							onchange={(e) => {
								strategy.data.strategy.update((s) => ({
									...s,
									name: e.currentTarget.value
								}));
							}}
						/>
					{:else}
						<h2>
							{$name} ({$strategy.strategy.data.eventKey}
							{$strategy.strategy.data.compLevel}{$strategy.strategy.data.matchNumber})
						</h2>
					{/if}
				</div>
				<div class="col-4 d-flex justify-content-end align-items-start">
					<button class="btn btn-secondary mb-2" onclick={() => (edit = !edit)}>
						{edit ? 'View' : 'Edit'}
					</button>
				</div>
			</div>
			<div class="row mb-3">
				<div class="col-12 mb-3">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					{#if edit}
						<label class="form-label">Notes</label>
						<textarea
							class="form-control mb-2"
							rows={4}
							placeholder="Notes"
							value={$notes}
							onchange={(e) => {
								strategy.data.strategy.update((s) => ({
									...s,
									notes: e.currentTarget.value
								}));
							}}
						></textarea>
					{:else}
						<p>{$notes}</p>
					{/if}
				</div>
			</div>
			<div class="row mb-3">
				{#key render}
					<div class="col-md-6 col-sm-12 mb-3">
						<h5>Partners</h5>
						{#if partnerScouting.length}
							<CombinedTeamContribution {event} teams={partnerScouting} {staticY} type="max" />
						{/if}
						{#if edit}
							{@render editPartner($strategy.partner1, 'red')}
							{@render editPartner($strategy.partner2, 'red')}
							{@render editPartner($strategy.partner3, 'red')}
						{:else}
							{@render showPartner($strategy.partner1, 'red')}
							{@render showPartner($strategy.partner2, 'red')}
							{@render showPartner($strategy.partner3, 'red')}
						{/if}
					</div>
					<div class="col-md-6 col-sm-12 mb-3">
						<h5>Opponents</h5>
						{#if opponentScouting.length}
							<CombinedTeamContribution {event} teams={opponentScouting} {staticY} type="max" />
						{/if}
						{#if edit}
							{@render editOpponent($strategy.opponent1, 'blue')}
							{@render editOpponent($strategy.opponent2, 'blue')}
							{@render editOpponent($strategy.opponent3, 'blue')}
						{:else}
							{@render showOpponent($strategy.opponent1, 'blue')}
							{@render showOpponent($strategy.opponent2, 'blue')}
							{@render showOpponent($strategy.opponent3, 'blue')}
						{/if}
					</div>
				{/key}
			</div>
		</div>
	</div>
	<div class="row mb-3">
		<Whiteboard board={strategy.board} />
	</div>
</div>
