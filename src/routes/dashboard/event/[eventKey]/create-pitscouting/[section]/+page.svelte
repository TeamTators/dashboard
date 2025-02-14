<script lang="ts">
	import EditSection from '$lib/components/pit-scouting/EditSection.svelte';
	import { Scouting } from '$lib/model/scouting';
	import { prompt, select } from '$lib/utils/prompts';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { TBAEvent } from '$lib/utils/tba.js';
	import { goto } from '$app/navigation';

	const { data } = $props();
	const { eventKey, year, section, sectionIndex } = data;

	let sections = $state(new DataArr(Scouting.PIT.Sections, []));

	onMount(() => {
		sections = Scouting.PIT.Sections.fromProperty('eventKey', page.params.eventKey, false);
		sections.sort((a, b) => Number(a.data.order) - Number(b.data.order));
	});
</script>

<div class="container">
	<div class="row">
		<h2>Pitscouting</h2>
	</div>
	<div class="row">
		<div class="card">
			<div class="card-body">
				<div class="no-scroll-y scroll-x ws-nowrap">
					{#each $sections as section, i}
						<button
							onclick={() => {
								goto(`/dashboard/event/${eventKey}/create-pitscouting/${i}`);
							}}
							class="btn btn-primary"
							disabled={sectionIndex === i}
						>
							{section.data.name}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
	<EditSection {section} />
</div>
