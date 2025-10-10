<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import Section from '$lib/components/pit-scouting/Section.svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { sleep } from 'ts-utils/sleep';
	import { onMount } from 'svelte';
	import { listen } from '$lib/utils/struct-listener.js';
	import PictureDisplay from '$lib/components/robot-display/PictureDisplay.svelte';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';

	const { data = $bindable() } = $props();
	// const { eventKey, section, sections, teams, team, sectionIndex } = data;
	const eventKey = $derived(data.eventKey);
	const section = $derived(data.section);
	const sections = $derived(data.sections);
	const teams = $derived(data.teams);
	const event = $derived(new TBAEvent(data.event));
	const team = $derived(new TBATeam(data.team, event));
	const sectionIndex = $derived(data.sectionIndex);
	const groups = $derived(data.groups);
	const answers = $derived(data.answers);
	const questions = $derived(data.questions);
	const pictures = $derived(data.pictures);

	$effect(() => nav(event.tba));

	let scroller: HTMLDivElement;

	afterNavigate(() => {
		const btn = scroller.querySelector(`[data-team="${team.tba.team_number}"]`);
		if (btn) {
			sleep(500).then(() =>
				btn.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'center'
				})
			);
		}
	});

	onMount(() => {
		const offSections = listen(sections, (s) => s.data.eventKey === event.tba.key);
		const offGroups = listen(groups, (g) => section.data.id === g.data.sectionId);
		const offQuestions = listen(
			questions,
			(q) => !!groups.data.find((g) => g.data.id === q.data.groupId)
		);
		const offAnswers = listen(
			answers,
			(a) => !!questions.data.find((q) => q.data.id === a.data.questionId)
		);

		return () => {
			offSections();
			offGroups();
			offQuestions();
			offAnswers();
		};
	});
</script>

<div class="container">
	<div class="row mb-3">
		<h2>Pitscouting: {team.tba.nickname}</h2>
	</div>
	<div class="row mb-3">
		<div class="ws-nowrap p-3 mb-3" bind:this={scroller} style="overflow-x: auto;">
			{#each teams as t}
				<a
					type="button"
					href="/dashboard/event/{eventKey}/pit-scouting/{sectionIndex}/team/{t.team_number}"
					class="btn mx-2"
					class:btn-primary={t.team_number !== team.tba.team_number}
					class:btn-outline-secondary={t.team_number === team.tba.team_number}
					class:btn-disabled={t.team_number === team.tba.team_number}
					class:text-muted={t.team_number === team.tba.team_number}
					onclick={(e) => {
						if (t.team_number === team.tba.team_number) {
							return e.preventDefault();
						}
					}}
					data-team={t.team_number}
				>
					{t.team_number}
				</a>
			{/each}
		</div>
	</div>
	<div class="row mb-3">
		<div class="no-scroll-y ws-nowrap" style="overflow-x: auto;">
			{#each $sections as section, i}
				<button
					onclick={() => {
						goto(
							`/dashboard/event/${eventKey}/pit-scouting/${section.data.id}/team/${team.tba.team_number}`
						);
					}}
					class="btn btn-primary mx-2"
					disabled={sectionIndex === i}
				>
					{section.data.name}
				</button>
			{/each}
		</div>
	</div>
	{#key team}
		<Section
			{section}
			team={team.tba.team_number}
			groups={$groups.filter((g) => g.data.sectionId === section.data.id)}
			{questions}
			{answers}
			session={data.session}
		/>
		<div style="height: 300px" class="layer-1">
			<PictureDisplay {team} {event} teamPictures={pictures} />
		</div>
	{/key}
</div>
