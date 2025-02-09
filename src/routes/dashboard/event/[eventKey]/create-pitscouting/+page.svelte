<script lang="ts">
	import EditSection from '$lib/components/pit-scouting/EditSection.svelte';
	import { Scouting } from '$lib/model/scouting';
	import { prompt, select } from '$lib/utils/prompts';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { TBAEvent } from '$lib/utils/tba.js';

	const { data } = $props();
	const { eventKey, year } = data;

	let sections = $state(new DataArr(Scouting.PIT.Sections, []));
	let selectedSection: Scouting.PIT.SectionData | undefined = $state(undefined);

	onMount(() => {
		sections = Scouting.PIT.Sections.fromProperty('eventKey', page.params.eventKey, false);
		sections.sort((a, b) => Number(a.data.order) - Number(b.data.order));

		selectedSection = $sections[0];
	});

	const addSection = async () => {
		const name = await prompt('Section Name');
		if (!name) return;

		Scouting.PIT.Sections.new({
			name,
			order: $sections.length,
			eventKey
		});
	};

	const copy = async () => {
		try {
			const events = (await TBAEvent.getEvents(year))
				.unwrap()
				.filter((e) => e.tba.key !== eventKey);

			const withSections = (
				await Promise.all(
					events.map(async (e) => {
						const sections = (
							await Scouting.PIT.Sections.fromProperty('eventKey', e.tba.key, true).await()
						).unwrap();
						return { event: e, sections };
					})
				)
			).filter((e) => e.sections.length);

			const selected = await select(
				'Choose an event to copy from',
				withSections.map((e) => e.event.tba.name)
			);

			if (!selected) return;
			Scouting.PIT.Sections.call('copy-from-event', {
				from: selected,
				to: eventKey
			});
		} catch (err) {
			console.error(err);
		}
	};
	const generateEventTemplate = () => {
		Scouting.PIT.Sections.call('generate-event-template', {
			eventKey: eventKey
		});
	};
</script>

<div class="container">
	<div class="row">
		<div class="col-md-6">
			<h2>Pitscouting</h2>
		</div>
		<div class="col-md-6">
			{#if $sections.length}
				<select
					onchange={(event) => {
						selectedSection = $sections.find((s) => s.data.id === event.currentTarget.value);
					}}
				>
					<option disabled>Select a Section</option>
					{#each $sections as section}
						<option value={section.data.id}>{section.data.name}</option>
					{/each}
				</select>
			{:else}
				<p>No Sections Found</p>
			{/if}
		</div>
	</div>
	{#if selectedSection}
		<EditSection section={selectedSection} />
	{:else}
		<button type="button" class="btn btn-primary" onclick={generateEventTemplate}>
			Generate Event Template
		</button>
		<button type="button" class="btn btn-primary" onclick={copy}> Copy From Event </button>
	{/if}
	<button class="btn btn-primary" onclick={addSection}>Add Section</button>
</div>
