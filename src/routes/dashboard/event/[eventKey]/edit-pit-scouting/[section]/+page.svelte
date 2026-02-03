<!--
@component
Pit scouting section editor for a specific section.

Allows navigation between sections and edits for the current section.
-->
<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	import EditSection from '$lib/components/pit-scouting/EditSection.svelte';
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const { data = $bindable() } = $props();
	// const { eventKey, year, section, sectionIndex } = data;
	const eventKey = $derived(data.eventKey);
	const sectionIndex = $derived(data.sectionIndex);
	const section = $derived(data.section);
	const _year = $derived(data.year);
	const event = $derived(data.event);

	$effect(() => nav(event));

	let sections = $state(new DataArr(Scouting.PIT.Sections, []));

	onMount(() => {
		sections = Scouting.PIT.Sections.get(
			{ eventKey: eventKey },
			{
				type: 'all'
			}
		);
		// sections.filter(s => true);
		sections.sort((a, b) => Number(a.data.order) - Number(b.data.order));
	});
</script>

<div class="container">
	<div class="row mb-3">
		<div class="mt-3 d-flex justify-content-between">
			<h2>Pitscouting</h2>
			<!-- This button doesn't do anything except force the user to escape from inputs -->
			<!-- 
				title="This button doesn't technically do anything. To save, all you have to do is click out of your input fields. This button is just here to give you something to click on." -->
			<button type="button" class="btn btn-success">
				<i class="material-icons">save</i>
				Save
			</button>
		</div>
	</div>
	<div class="row mb-3">
		<div class="card layer-1">
			<div class="card-body">
				<div class="no-scroll-y scroll-x ws-nowrap">
					<a href="/dashboard/event/{eventKey}/edit-pit-scouting" class="btn btn-primary">
						<i class="material-icons"> arrow_back </i>
						Back
					</a>
					{#each $sections as section, i}
						<button
							onclick={() => {
								goto(`/dashboard/event/${eventKey}/edit-pit-scouting/${i}`);
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
	{#key section}
		<EditSection {section} />
	{/key}
</div>
