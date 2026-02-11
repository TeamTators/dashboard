<script lang="ts">
	import type { Scouting } from "$lib/model/scouting";
	import type { TBATeam } from "$lib/utils/tba";
    import RadarChart from "./RadarChart.svelte";

    interface Props {
        scouting: Scouting.MatchScoutingExtendedArr;
        team: TBATeam;
    }

    const { scouting, team }: Props = $props();

    // min/max
    const yearOpts: {
        [year: number]: [number, number];
    } = {
        2024: [0, 10],
        2025: [0, 10],
        2026: [0, 10]
    }

    let min = $derived(yearOpts[team.event.tba.year][0] ?? 0);
    let max = $derived(yearOpts[team.event.tba.year][1] ?? 10);
    const data = $derived(scouting.averageContribution(true));

    export const copy = (notify: boolean) => {};
</script>

<RadarChart
    {team}
    data={$data}
    opts={{
        min,
        max
    }}
/>