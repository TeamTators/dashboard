<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { prompt, select } from '$lib/utils/prompts';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { TBAEvent } from '$lib/utils/tba.js';

	const { data } = $props();
	const { eventKey, year } = data;

	let sections = $state(new DataArr(Scouting.PIT.Sections, []));

	onMount(() => {
		sections = Scouting.PIT.Sections.fromProperty('eventKey', page.params.eventKey, false);
		sections.sort((a, b) => Number(a.data.order) - Number(b.data.order));
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
		<button type="button" class="btn btn-primary" onclick={generateEventTemplate}>
			Generate Event Template
		</button>
		<button type="button" class="btn btn-primary" onclick={copy}> Copy From Event </button>
		<button class="btn btn-primary" onclick={addSection}>Add Section</button>
	</div>
	<div class="row">
		{#each $sections as section, i}
			<a href="/dashboard/event/{eventKey}/create-pitscouting/{i}">
				<div class="card">
					{section.data.name}
				</div>
			</a>
		{/each}
	</div>
</div>
