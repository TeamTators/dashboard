<script lang="ts">
	import { page } from '$app/state';
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';

	const { data } = $props();
	const { eventKey } = data;
	let sections = $state(new DataArr(Scouting.PIT.Sections, []));

	onMount(() => {
		sections = Scouting.PIT.Sections.fromProperty('eventKey', page.params.eventKey, false);
		sections.sort((a, b) => Number(a.data.order) - Number(b.data.order));
	});
</script>

<div class="container-fluid">
	{#if $sections.length}
		{#each $sections as section, i}
			<div class="row">
				<a href="/dashboard/event/{eventKey}/pitscouting/{i}">
					<!-- <a href="{location.href}/pitscouting/{i}">  -->
					<div class="card">
						<div class="card-header">
							{section.data.name}
						</div>
					</div>
				</a>
			</div>
		{/each}
	{:else}
		<div class="row">
			<p>No sections found</p>
		</div>
	{/if}
</div>
