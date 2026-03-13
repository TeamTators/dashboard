<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	interface Props {
		eventKey: string;
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { scouting, eventKey }: Props = $props();

	let data = $state(writable<Record<string, number>>({}));

	onMount(() => {
		scouting.contribution(eventKey, true, 'average').then((res) => {
			if (res.isOk()) data = res.value;
			else console.error(res.error);
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
