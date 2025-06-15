<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBATeam, TBAEvent } from '$lib/utils/tba';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import Trace from './Trace.svelte';
	import { confirm } from '$lib/utils/prompts';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
	}

	const { team, event }: Props = $props();

	let matches = $state(new DataArr(Scouting.MatchScouting, []));

	onMount(() => {
		matches = Scouting.getArchivedMatches(team.tba.team_number, event.tba.key);

		return matches.subscribe(console.log);
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		{#each $matches as match}
			<div class="col-md-4">
				<div class="card">
					<div class="card-body">
						<h5 class="card-title">{match.data.compLevel} {match.data.matchNumber}</h5>
						<Trace scouting={match} />
						<button
							type="button"
							class="btn btn-success"
							onclick={async () => {
								if (await confirm('Restore this match?')) {
									match.setArchive(false);
								}
							}}
						>
							<i class="material-icons"> restore_from_trash </i>
							Restore
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
