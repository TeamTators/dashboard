<!--
@fileoverview Dropdown selector for TBA teams with optional placeholder and selection callback.

@component TeamSelect

@description
Displays a Bootstrap-styled `<select>` containing team numbers and nicknames. When a user selects
an option, the component finds the matching team and calls `onSelect` while also updating the
bindable `selected` value.

@example
```svelte
<script lang="ts">
  import TeamSelect from '$lib/components/FIRST/TeamSelect.svelte';
  import type { TBATeam } from '$lib/utils/tba';

  let teams: TBATeam[] = [];
  let selected: TBATeam | undefined;

  const handleTeam = (team: TBATeam) => {
    selected = team;
  };
</script>

<TeamSelect {teams} bind:selected onSelect={handleTeam} message="Select a team" />
```
-->
<script lang="ts">
	import { TBATeam } from '$lib/utils/tba';
	/** Component props for `TeamSelect`. */
	interface Props {
		/** Teams to list in the dropdown. */
		teams: TBATeam[];
		/** Optional callback fired when a team is chosen. */
		onSelect?: (match: TBATeam) => void;
		/** Currently-selected team (bindable). */
		selected?: TBATeam;
		/** Optional placeholder message for the disabled option. */
		message?: string;
	}

	let { teams, onSelect, selected = $bindable(), message }: Props = $props();
</script>

<select
	class="form-select"
	onchange={(event) => {
		const num = parseInt(event.currentTarget.value);
		const team = teams.find((team) => team.tba.team_number === num);
		if (team) {
			onSelect?.(team);
			selected = team;
		}
	}}
>
	<option value="" selected disabled>
		{#if message}
			{message}
		{:else}
			Select a team
		{/if}
	</option>
	{#each teams as team}
		<option
			value={team.tba.team_number}
			selected={team.tba.team_number === selected?.tba.team_number}
			>{team.tba.team_number} {team.tba.nickname}</option
		>
	{/each}
</select>
