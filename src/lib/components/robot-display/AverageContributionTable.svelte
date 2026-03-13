<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	interface Props {
		year: number;
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { scouting, year }: Props = $props();

	let data = $state(writable<Record<string, number>>({}));

	onMount(() => {
		scouting.contribution(year, true, 'average').then((res) => {
			if (res.isOk()) data = res.value;
		});
	});
</script>

<table class="table table-striped">
	<tbody>
		{#each Object.entries($data) as [contribution, avg]}
			<tr>
				<td>Average {contribution}</td>
				<td>{avg.toFixed(2)}</td>
			</tr>
		{/each}
	</tbody>
</table>
