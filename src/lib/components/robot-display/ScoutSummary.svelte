<script lang="ts">
	interface Props {
		scouts: {
			[key: string]: string;
		};
	}

	const { scouts }: Props = $props();

	const data = $derived(
		Object.entries(scouts).reduce(
			(cur, acc) => {
				const [_, user] = acc;
				if (cur[user]) {
					cur[user] += 1;
				} else {
					cur[user] = 1;
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
			<span class="list-item-title">{user}</span>
			<span class="list-item-count">{count}</span>
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
