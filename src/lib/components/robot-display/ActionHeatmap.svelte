<script lang="ts" generics="Actions extends string">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { ActionHeatmap } from '$lib/model/match-html';
	import type { YearInfo } from 'tatorscout/years';

	interface Props {
		scouting: Scouting.MatchScoutingExtendedArr;
		yearInfo: YearInfo;
		year: number;
	}

	let actions: Actions[] = $state([]);

	export const getActions = () => actions;

	const { scouting, yearInfo, year }: Props = $props();

	const h = $derived(new ActionHeatmap(scouting, yearInfo, year));

	export const filter = (...actions: Actions[]) => {
		h.filter(...actions);
	};
</script>

<div {@attach (div) => {
	h.init(div);
}}></div>
