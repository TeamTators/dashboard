<script lang="ts">
	import { TBATeam } from '$lib/utils/tba';
	interface Props {
		teams: TBATeam[];
		onSelect?: (match: TBATeam) => void;
		selected?: TBATeam;
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
