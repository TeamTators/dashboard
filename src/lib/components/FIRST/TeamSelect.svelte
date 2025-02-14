<script lang="ts">
	import { TBATeam } from '$lib/utils/tba';
	interface Props {
		teams: TBATeam[];
		onSelect?: (match: TBATeam) => void;
		selected: TBATeam | undefined;
	}

	let { teams, onSelect, selected = $bindable() }: Props = $props();
</script>

<select
	onchange={(event) => {
		const num = parseInt(event.currentTarget.value);
		const team = teams.find((team) => team.tba.team_number === num);
		if (team) {
			onSelect?.(team);
			selected = team;
		}
	}}
>
	<option value="" selected disabled>Select a team</option>
	{#each teams as team}
		<option value={team.tba.team_number}>{team.tba.team_number}</option>
	{/each}
</select>
