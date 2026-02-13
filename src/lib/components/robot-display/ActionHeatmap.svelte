<!--
@fileoverview Interactive action heatmap for match scouting traces.

@component ActionHeatmap

@description
Creates a heatmap from match scouting data for a given year and exposes helpers to filter
actions and access the resolved action list.

@example
```svelte
<script lang="ts">
  import ActionHeatmap from '$lib/components/robot-display/ActionHeatmap.svelte';
  import type { Scouting } from '$lib/model/scouting';

  let scouting: Scouting.MatchScoutingExtendedArr;
  let heatmap: ActionHeatmap | undefined;

  const showCl4 = () => heatmap?.filter('cl4');
</script>

<ActionHeatmap bind:this={heatmap} {scouting} year={2025} />
```
-->
<script lang="ts" generics="Actions extends string">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { ActionHeatmap } from '$lib/model/match-html';

	interface Props {
		/** Scouting data source to build the heatmap from. */
		scouting: Scouting.MatchScoutingExtendedArr;
		/** Competition year to select the action set. */
		year: number;
		/** Whether to display action buttons. */
		doButtons: boolean;
	}

	let actions: Actions[] = $state([]);

	/**
	 * Return the current list of available actions.
	 *
	 * @example
	 * ```ts
	 * const actions = heatmap.getActions();
	 * ```
	 */
	export const getActions = () => actions;

	const { scouting, year, doButtons }: Props = $props();

	const h = $derived(new ActionHeatmap(scouting, year, { doButtons }));

	/**
	 * Filter the heatmap to only show the provided actions.
	 *
	 * @example
	 * ```ts
	 * heatmap.filter('cl1', 'cl2');
	 * ```
	 */
	export const filter = (...actions: Actions[]) => {
		h.filter(...actions);
	};

	let target: HTMLDivElement;

	onMount(() => {
		return h.init(target);
	});
</script>

<div bind:this={target}></div>
