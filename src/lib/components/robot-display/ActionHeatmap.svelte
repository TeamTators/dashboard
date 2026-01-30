<script lang="ts" generics="Actions extends string">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { ActionHeatmap } from '$lib/model/match-html';

	interface Props {
		scouting: Scouting.MatchScoutingExtendedArr;
		year: number;
	}

	let actions: Actions[] = $state([]);

	export const getActions = () => actions;

	const { scouting, year }: Props = $props();

	const h = $derived(new ActionHeatmap(scouting, year));

	export const filter = (...actions: Actions[]) => {
		h.filter(...actions);
	};

	let target: HTMLDivElement;

	onMount(() => {
		return h.init(target);
	});
</script>

<div bind:this={target}></div>
