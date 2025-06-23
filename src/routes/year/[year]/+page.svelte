<script lang="ts">
	import Card from '$lib/components/bootstrap/Card.svelte';
	import { date } from 'ts-utils/clock';
	const { data } = $props();
	const events = data.events;
</script>

<div class="container">
	<div class="row">
		{#each events as event}
			<div class="col-md-6 p-3">
				<a href="/dashboard/event/{event.key}" class="text-reset text-decoration-none">
					<div class="card bg-primary">
						<div class="card-body">
							<h5 class="card-title">{event.name}</h5>
							<p class="card-text">{date(event.start_date)} - {date(event.end_date)}</p>
						</div>
					</div>
				</a>
			</div>
		{/each}
	</div>
</div>
