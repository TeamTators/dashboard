<!--
@fileoverview List of archived match scoutings with restore controls.

@component ArchivedMatches

@description
Loads archived matches for a team/event pair and renders each trace with a restore button.

@example
```svelte
<ArchivedMatches {team} {event} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBATeam, TBAEvent } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import Trace from './TraceHTML.svelte';
	import { confirm } from '$lib/utils/prompts';

	interface Props {
		/** Team to fetch archived matches for. */
		team: TBATeam;
		/** Event to fetch archived matches for. */
		event: TBAEvent;
	}

	const { team, event }: Props = $props();

	let matches = $state(new Scouting.MatchScoutingExtendedArr([], -1));

	onMount(() => {
		const res = Scouting.getArchivedMatches(team.tba.team_number, event.tba.key);
		if (res.isOk()) {
			matches = res.value;
		}
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		{#each $matches as match}
			<div class="col-md-4">
				<div class="card">
					<div class="card-body">
						<h5 class="card-title">{match.compLevel} {match.matchNumber}</h5>
						<Trace scouting={match} />
						<button
							type="button"
							class="btn btn-success"
							onclick={async () => {
								if (await confirm('Restore this match?')) {
									match.scouting.setArchive(false);
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
