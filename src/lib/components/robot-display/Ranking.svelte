<script lang="ts">
	import { FIRST } from '$lib/model/FIRST';
	import type { TBAEvent } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import { after } from 'ts-utils';

	interface Props {
		event: TBAEvent;
		team: number;
	}

	const { event, team }: Props = $props();

	let ranking: {
		[group: string]: {
			[item: string]: number;
		};
	} = $state({});

	onMount(() => {
		FIRST.getSummary(event.tba.key, event.tba.year as 2024 | 2025, {
			cacheExpires: after(10 * 60 * 1000) // 10 minutes
		}).then((res) => {
			if (res.isOk()) {
				const data = res.value.getRanking(team);
				if (data) ranking = data;
			}
		});
	});
</script>

<div class="table-container">
	<table class="table table-dark">
		<tbody>
			{#each Object.entries(ranking) as [group, items]}
				<tr>
					<th colspan="2" class="text-center">{group}</th>
				</tr>
				{#each Object.entries(items) as [item, value]}
					<tr>
						<td>{item}</td>
						<td class="text-end">#{value}</td>
					</tr>
				{/each}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		overflow-y: scroll;
		height: 100%;
		overflow-x: hidden;
	}
</style>
