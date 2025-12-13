<script lang="ts">
	import * as TBA from '$lib/utils/tba';
	import { dateTime } from 'ts-utils/clock';
	let eventKey = $state('');
	let event: TBA.TBAEvent | null = $state(null);
	let matches: TBA.TBAMatch[] = $state([]);
	let teams: TBA.TBATeam[] = $state([]);

	let status = $state('Pending');
	let complete = $state(false);

	const getEvent = async () => {
		eventKey = eventKey.trim().toLowerCase();
		const e = await TBA.TBAEvent.getEvent(eventKey, true, new Date());
		if (e.isErr()) return (status = 'Failed');

		const eventTeams = await e.value.getTeams(true, new Date());
		if (eventTeams.isErr()) return (status = 'Failed');

		const eventMatches = await e.value.getMatches(true, new Date());
		if (eventMatches.isErr()) return (status = 'Failed');

		event = e.value;
		teams = eventTeams.value;
		matches = eventMatches.value;

		status = 'Success';
	};

	$effect(() => {
		complete = status !== 'Pending';
	});

	$inspect(event);
	$inspect(teams);
	$inspect(matches);
</script>

<div class="container">
	<div class="row">
		<div class="col">
			<h1>TBA Testing Suite</h1>
			<small id="status" class="text-muted">{status}</small>
			<small id="complete" class="text-muted" class:d-none={!complete}>
				{#if complete}
					Test Complete!
				{/if}
			</small>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<div class="d-flex">
				<input
					id="event-key-input"
					type="text"
					class="form-control"
					bind:value={eventKey}
					placeholder="Event Key"
				/>
				<button id="get-data" class="btn btn-primary" onclick={async () => getEvent()}
					>Get Data</button
				>
			</div>
		</div>
	</div>
	{#if event}
		<div class="row">
			<div class="col">
				<h2>Event</h2>
				<p>{event.tba.name}</p>
				<p>{dateTime(new Date(event.tba.start_date))}</p>
				<p>Matches: {matches.length}</p>
				<p>Teams: {teams.length}</p>
			</div>
		</div>
	{/if}
</div>
