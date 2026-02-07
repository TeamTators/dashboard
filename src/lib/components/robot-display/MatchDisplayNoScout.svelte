<!--
@fileoverview Fallback match view when no scouting data is available.

@component MatchDisplayNoScout

@description
Shows match videos and a minimal endgame summary when a scouting record is missing.

@example
```svelte
<MatchDisplayNoScout {match} {team} {event} strategies={[]} />
```
-->
<script lang="ts">
	import type { Strategy } from '$lib/model/strategy';
	import { TBAEvent, TBATeam, TBAMatch } from '$lib/utils/tba';
	import MatchEndgame from './MatchEndgame.svelte';

	interface Props {
		/** Match being displayed. */
		match: TBAMatch;
		/** Team context for messaging. */
		team: TBATeam;
		// focus: Focus;
		/** Event context for messaging and navigation. */
		event: TBAEvent;
		/** Optional strategies for navigation. */
		strategies?: Strategy.StrategyData[];
	}

	const { team, event, match, strategies }: Props = $props();
</script>

<div class="container-fluid">
	<div class="row mb-3">
		No scouting data found for {team.tba.nickname} - {event.tba.name}
		{match.tba.comp_level}{match.tba.match_number}. Here's what I can show you:
	</div>
	<div class="row mb-3">
		{#each match.tba.videos || [] as video}
			<div class="col-md-6">
				<div class="card h-100">
					<div class="card-body p-1">
						{#if video.type === 'youtube'}
							<iframe
								src="https://www.youtube.com/embed/{video.key}?autoplay=0&controls=1&loop=0&modestbranding=1&rel=0&showinfo=0&color=white&iv_load_policy=3&fs=1&disablekb=1&enablejsapi=1&origin=https%3A%2F%2Fwww.thebluealliance.com&widgetid=1"
								frameborder="0"
								title="YouTube video player"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="w-100 mb-0"
								style="
									height: 200px;
								"
							></iframe>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
	<div class="row mb-3">
		<div class="col-md-4">
			<MatchEndgame {match} {team} {event} classes="layer-1" />
		</div>
	</div>
	<div class="row mb-3">
		{#if strategies && strategies.length}
			<button type="button" class="btn btn-primary" onclick={() => {}}>
				<i class="material-icons"> auto_graph </i>
				Open Strategy ({strategies.length})
			</button>
		{/if}
	</div>
</div>
