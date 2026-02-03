<!--
@component
Custom TBA event creation form.

Validates event keys and dates, and creates a new custom event.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { TBAEvent } from '$lib/utils/tba';
	import { onMount } from 'svelte';

	let eventKey = $state('2025feac');
	let eventName = $state('First Event at Acme Corp');
	let start_date = $state('2025-04-01');
	let end_date = $state('2025-04-03');
	let year: number = $state(0);

	let eventState: 'ready' | 'finding' | 'found' | 'not_found' | 'invalid' | 'too_long' =
		$state('ready');
	let eventTimeout: ReturnType<typeof setTimeout> | null = null;

	const toDate = (dateString: string) => {
		const [year, month, day] = dateString.split('-').map(Number);
		if (isNaN(year) || isNaN(month) || isNaN(day)) {
			console.error('Invalid date format:', dateString);
			return null;
		}
		const d = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
		if (isNaN(d.getTime())) {
			return null;
		}
		return d;
	};

	let dateState: 'valid' | 'bad_order' | 'invalid_date' | 'ready' | 'invalid' = $state('ready');

	const validateEventDates = () => {
		if (!start_date || !end_date) {
			dateState = 'ready';
			return false;
		}
		const start = toDate(start_date);
		const end = toDate(end_date);
		if (!start || !end) {
			dateState = 'invalid_date';
			return false;
		}
		if (start.getTime() > end.getTime()) {
			dateState = 'bad_order';
			return false;
		}
		if (year && start.getFullYear() !== year) {
			dateState = 'invalid';
			// console.error(`Start date year ${start.getFullYear()} does not match event year ${year}`);
			return false;
		}
		if (year && end.getFullYear() !== year) {
			dateState = 'invalid';
			// console.error(`End date year ${end.getFullYear()} does not match event year ${year}`);
			return false;
		}
		dateState = 'valid';
		return true;
	};

	const findEvent = (key: string) => {
		key = key.trim();
		// text must match 20XX[a-z] format
		if (!/^\d{4}[a-z]+$/.test(key)) {
			eventState = 'invalid';
			return;
		}
		if (key.length > 10) {
			eventState = 'too_long';
			return;
		}
		eventState = 'finding';

		if (eventTimeout) {
			clearTimeout(eventTimeout);
			eventTimeout = null;
		}
		setTimeout(async () => {
			const event = await TBAEvent.getEvent(key, true, new Date());
			if (event.isErr()) {
				eventState = 'not_found';
				year = parseInt(key.substring(0, 4), 10);
				return;
			}
			eventState = 'found';
		}, 500); // Delay to prevent too many requests
	};

	const submit = async () => {
		if (
			dateState === 'valid' &&
			eventName.length >= 3 &&
			eventState === 'not_found' &&
			eventKey &&
			year
		) {
			const res = await TBAEvent.createEvent({
				key: eventKey,
				name: eventName,
				start_date,
				end_date,
				year
			});

			if (res.isErr()) {
				console.error('Error creating event:', res.error);
				return;
			}
			// console.log('Event created successfully:', res.value);
			goto(`/dashboard/mentor/custom-tba/event/${eventKey}`);
		} else {
			console.error('Form is not valid for submission');
		}
	};

	onMount(() => {
		if (eventKey) {
			// for dev purposes only
			findEvent(eventKey);

			year = parseInt(eventKey.substring(0, 4), 10);
			if (year) {
				start_date = `${year}-01-01`;
				end_date = `${year}-12-31`;
				validateEventDates();
			} else {
				console.error('Invalid event key format:', eventKey);
			}
		}
	});
</script>

<div class="container layer-1">
	<div class="row mb-3">
		<div class="col">
			<h1>Custom TheBlueAlliance Event</h1>
			<p class="text-muted">
				Create your new custom event here. Once it's created, you can still edit it.
			</p>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-md-6">
			<div class="mb-3">
				<label for="event-key-input" class="form-label">Event Key</label>
				<input
					type="text"
					class="form-control"
					id="event-key-input"
					placeholder="2025idbo..."
					oninput={(e) => findEvent(e.currentTarget.value)}
					bind:value={eventKey}
				/>
			</div>
		</div>
		<div class="col-md-6">
			<label for="event-key-status" class="form-label">Event Key Status</label>
			<div>
				{#if eventState === 'ready'}
					<i class="material-icons text-muted"> search </i>
					<span class="text-muted">Enter an event key to search for an event.</span>
				{:else if eventState === 'finding'}
					<div class="spinner-border text-primary" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				{:else if eventState === 'too_long'}
					<i class="material-icons text-warning"> warning </i>
					<span class="text-warning"
						>Event key is too long. Please use a key under 10 characters.</span
					>
				{:else if eventState === 'found'}
					<i class="material-icons text-danger"> error </i>
					<span class="text-danger">Event has been found. Please try a different event key.</span>
				{:else if eventState === 'not_found'}
					<i class="material-icons text-success"> check_circle </i>
					<span class="text-success">Looks good! You can create a new event with this key.</span>
				{:else if eventState === 'invalid'}
					<i class="material-icons text-warning"> warning </i>
					<span class="text-warning"
						>Invalid event key format. Please use the format 20XX[ab][cd].</span
					>
				{/if}
			</div>
		</div>
	</div>
	{#if eventState === 'not_found'}
		<div class="row mb-3">
			<div class="col">
				<div class="mb-3">
					<label for="event-name-input" class="form-label">Event Name</label>
					<input
						type="text"
						class="form-control"
						id="event-name-input"
						placeholder="Event Name"
						bind:value={eventName}
					/>
				</div>
				{#if eventName.length < 3}
					<div class="alert alert-warning" role="alert">
						<i class="material-icons">warning</i>
						The event name must be at least 3 characters long.
					</div>
				{/if}
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-md-6">
				<div class="mb-3">
					<label for="start-date-input" class="form-label">Start Date</label>
					<input
						type="date"
						class="form-control"
						id="start-date-input"
						bind:value={start_date}
						oninput={validateEventDates}
					/>
				</div>
			</div>
			<div class="col-md-6">
				<div class="mb-3">
					<label for="end-date-input" class="form-label">End Date</label>
					<input
						type="date"
						class="form-control"
						id="end-date-input"
						bind:value={end_date}
						oninput={validateEventDates}
					/>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col">
				{#if dateState === 'bad_order'}
					<div class="alert alert-danger" role="alert">
						<i class="material-icons">error</i>
						The start date must be before the end date.
					</div>
				{:else if dateState === 'invalid'}
					<div class="alert alert-danger" role="alert">
						<i class="material-icons">error</i>
						The start and end dates must match the event year ({year}).
					</div>
				{:else if dateState === 'invalid_date'}
					<div class="alert alert-danger" role="alert">
						<i class="material-icons">error</i>
						One or both of the dates are invalid. Please check the format.
					</div>
				{:else if dateState === 'ready'}
					<div class="alert alert-info" role="alert">
						<i class="material-icons">info</i>
						Please enter the start and end dates for the event.
					</div>
				{:else if dateState === 'valid'}
					<div class="alert alert-success" role="alert">
						<i class="material-icons">check_circle</i>
						Looks good! The dates are valid.
					</div>
				{/if}
			</div>
		</div>
		{#if dateState === 'valid' && eventName.length >= 3 && eventKey}
			<div class="row mb-3">
				<div class="col">
					<button type="button" class="btn btn-success w-100" onclick={submit}>
						Submit Event
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
