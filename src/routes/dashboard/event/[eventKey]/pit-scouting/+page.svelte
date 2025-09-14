<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { page } from '$app/state';
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import { listen } from '$lib/utils/struct-listener.js';

	const { data } = $props();
	const event = $derived(data.event);
	const eventKey = $derived(event.key);
	const sections = $derived(data.sections);

	$effect(() => nav(event));

	onMount(() => {
		sections.sort((a, b) => Number(a.data.order) - Number(b.data.order));
		return listen(sections, (d) => d.data.eventKey === eventKey);
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<h1>Pit Scouting</h1>
		<small class="text-muted">Select a section to scout</small>
	</div>
	{#if $sections.length}
		<div class="row mb-3">
			{#each $sections as section, i}
				<div class="col-md-4 p-3">
					<a
						href="/dashboard/event/{eventKey}/pit-scouting/{i}"
						class="text-reset text-decoration-none"
					>
						<!-- <a href="{location.href}/pitscouting/{i}">  -->
						<div class="card">
							<div class="card-body">
								<h5 class="card-title">{section.data.name}</h5>
							</div>
						</div>
					</a>
				</div>
			{/each}
		</div>
	{:else}
		<div class="row">
			<p>No sections found</p>
		</div>
	{/if}
</div>
