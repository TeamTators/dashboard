<script lang="ts">
    interface Props {
	checks: {
		[key: string]: string[];
	};
}

const { checks }: Props = $props();

const data = $derived(
	Object.values(checks).flat().reduce((cur, check) => {
		if (cur[check]) {
			cur[check] += 1;
		} else {
			cur[check] = 1;
		}
		return cur;
	}, {} as { [key: string]: number })
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