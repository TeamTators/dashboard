<script lang="ts">
	import { TBATeam } from '$lib/utils/tba';
	interface Props {
		teams: TBATeam[];
		onSelect?: (match: TBATeam) => void;
		selected?: TBATeam;
	}

	let { teams, onSelect, selected = $bindable() }: Props = $props();
</script>

<div class="ws-nowrap p-3 scroll-x" style="width: 100% !important;">
	{#each teams as team}
		<button
			type="button"
			class="btn mx-2"
			class:btn-outline-primary={selected?.tba.team_number === team.tba.team_number}
			class:btn-primary={selected?.tba.team_number !== team.tba.team_number}
			onclick={() => {
				selected = team;
				onSelect?.(team);
			}}
		>
			{team.tba.team_number}
		</button>
	{/each}
</div>
