<!--
@fileoverview Aggregated summary of checks across users or matches.

@component ChecksSummary

@description
Aggregates a map of check arrays into a frequency table and renders each check with its count.

@example
```svelte
<ChecksSummary checks={{ alice: ['autoMobility'], bob: ['autoMobility', 'parked'] }} />
```
-->
<script lang="ts">
	interface Props {
		/** Map of check lists keyed by user or source. */
		checks: {
			[key: string]: string[];
		};
	}

	const { checks }: Props = $props();

	const data = $derived(
		Object.values(checks)
			.flat()
			.reduce(
				(cur, check) => {
					if (cur[check]) {
						cur[check] += 1;
					} else {
						cur[check] = 1;
					}
					return cur;
				},
				{} as { [key: string]: number }
			)
	);
</script>

<ul class="list">
	{#each Object.entries(data) as [user, count]}
		<li class="list-item">
			<div class="d-flex justify-content-between">
				<span class="list-item-title">{user}</span>
				<span class="list-item-count">{count}</span>
			</div>
		</li>
	{/each}
</ul>

<style>
	.list-item-title {
		font-weight: bold;
	}

	.list-item-count {
		color: #666;
	}
</style>
