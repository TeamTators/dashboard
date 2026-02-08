<!--
@fileoverview List of derived match checks with color coding.

@component Checks

@description
Subscribes to a single match scouting record and renders the checks returned by
`scouting.getChecks()`, applying contextual Bootstrap colors per check type.

@example
```svelte
<Checks {scouting} classes="list-group-flush" />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { BootstrapColor } from 'colors/color';
	import { onMount } from 'svelte';
	import { capitalize, fromCamelCase } from 'ts-utils/text';

	interface Props {
		/** Match scouting record to compute checks from. */
		scouting: Scouting.MatchScoutingExtended;
		/** Optional CSS classes for list styling. */
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
		return scouting.subscribe(() => {
			try {
				checks = scouting.getChecks().unwrap();
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
