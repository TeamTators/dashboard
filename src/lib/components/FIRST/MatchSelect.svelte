<!--
@fileoverview Dropdown selector for TBA matches with a placeholder message and selection callback.

@component MatchSelect

@description
Renders a Bootstrap-styled `<select>` that lists matches by event key, comp level, and match number.
It supports an optional placeholder message and an `onSelect` callback that fires when a match is chosen.

@example
```svelte
<script lang="ts">
  import MatchSelect from '$lib/components/FIRST/MatchSelect.svelte';
  import type { TBAMatch } from '$lib/utils/tba';

  let matches: TBAMatch[] = [];
  let selected: TBAMatch | undefined;

  const handleSelect = (match: TBAMatch) => {
    selected = match;
  };
</script>

<MatchSelect {matches} bind:selected onSelect={handleSelect} message="Pick a match" />
```
-->
<script lang="ts">
	import { TBAMatch } from '$lib/utils/tba';

	/** Component props for `MatchSelect`. */
	interface Props {
		/** List of matches to populate the dropdown. */
		matches: TBAMatch[];
		/** Optional callback fired when a match is selected. */
		onSelect?: (match: TBAMatch) => void;
		/** Currently-selected match (bindable). */
		selected?: TBAMatch;
		/** Optional placeholder message for the disabled option. */
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
