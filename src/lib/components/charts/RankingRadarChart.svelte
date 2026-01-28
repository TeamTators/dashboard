<script lang="ts">
	import RadarChart from "./RadarChart.svelte";
	import { TBATeam } from '$lib/utils/tba';

	interface Props {
		team: TBATeam;
		eventSummary: unknown;
	}

	const { team, eventSummary }: Props = $props();
</script>
<RadarChart 
	team={}
	data={{}}
/>
