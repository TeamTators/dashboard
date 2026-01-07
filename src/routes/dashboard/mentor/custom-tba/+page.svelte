<script lang="ts">
	import { date } from 'ts-utils/clock';

	const { data } = $props();

	const events = $derived(data.events);
</script>

<div class="container layer-1">
	<div class="row mb-3">
		<div class="col">
			<h1>Custom TheBlueAlliance Data</h1>
			<p class="text-muted">
				Manage custom TheBlueAlliance data, including creating and managing custom events, teams,
				and matches.
				<br />
				<strong>Note:</strong> Custom TBA data is not synced with TheBlueAlliance and is only available
				on this instance.
			</p>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12">
			<a href="/dashboard/mentor/custom-tba/event" class="btn btn-success w-100">
				<i class="material-icons">add</i> Create New Event
			</a>
		</div>
	</div>
	<div class="row mb-3">
		{#each events as e}
			<div class="col-md-3">
				<a
					href={`/dashboard/mentor/custom-tba/event/${e.data.key}`}
					class="text-reset text-decoration-none"
				>
					<div class="card bg-primary">
						<div class="card-body">
							<h5 class="card-title">{e.data.name}</h5>
							<p class="card-text">
								<small class="text-muted">
									{date(e.data.start_date)} - {date(e.data.end_date)}
								</small>
							</p>
						</div>
					</div>
				</a>
			</div>
		{/each}
	</div>
</div>
