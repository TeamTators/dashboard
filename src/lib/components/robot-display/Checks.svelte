<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { BootstrapColor } from 'colors/color';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { capitalize, fromCamelCase } from 'ts-utils/text';
	import { z } from 'zod';

	interface Props {
		scouting: Scouting.MatchScoutingData;
		classes?: string;
	}

	const { scouting, classes }: Props = $props();
	let checks: string[] = $state([]);

	const checkColors: {
		[key: string]: BootstrapColor;
	} = {
		autoMobility: 'success',
		parked: 'success',
		playedDefense: 'primary',
		tippy: 'warning',
		easilyDefended: 'warning',
		robotDied: 'danger',
		problemsDriving: 'danger',
		groundPicks: 'primary',
		default: 'secondary'
	};

	onMount(() => {
		return scouting.subscribe((data) => {
			try {
				const c = data.checks || '[]';
				checks = z.array(z.string()).parse(JSON.parse(c));
				// checks.set(parsed);
			} catch (error) {
				console.error(error);
			}
		});
	});
</script>

<div>
	<h5 class="text-center">Checks</h5>
	<ul class="list-group {classes}">
		{#each checks as check (check)}
			<li class="list-group-item text-{checkColors[check] ?? checkColors.default} {classes}">
				{capitalize(fromCamelCase(check))}
			</li>
		{/each}
	</ul>
	{#if !checks.length}
		<p class="text-muted text-center">No checks available.</p>
	{/if}
</div>
