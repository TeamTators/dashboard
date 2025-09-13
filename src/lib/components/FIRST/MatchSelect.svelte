<script lang="ts">
	import { TBAMatch } from '$lib/utils/tba';

	interface Props {
		matches: TBAMatch[];
		onSelect?: (match: TBAMatch) => void;
		selected?: TBAMatch;
		message?: string;
	}

	let { matches, onSelect, selected = $bindable(), message }: Props = $props();
</script>

<select
	class="form-select"
	onchange={(event) => {
		const matchKey = event.currentTarget.value;
		const match = matches.find((match) => match.tba.key === matchKey);
		if (match) {
			onSelect?.(match);
		}
	}}
>
	<option value="" selected disabled>
		{#if message}
			{message}
		{:else}
			Select a match
		{/if}
	</option>
	{#each matches as match}
		<option value={match.tba.key} selected={match.tba.key === selected?.tba.key}>
			{match.tba.event_key}
			{match.tba.comp_level}
			{match.tba.match_number}
		</option>
	{/each}
</select>
