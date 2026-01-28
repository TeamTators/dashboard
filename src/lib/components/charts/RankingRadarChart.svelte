<script lang="ts">
	import RadarChart from "./RadarChart.svelte";
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { onMount } from "svelte";
	import { FIRST } from "$lib/model/FIRST";
	import { tomorrow } from "ts-utils";
	import { writable } from "svelte/store";

	interface Props {
		team: TBATeam;
		event: TBAEvent;
	}

	const { team, event }: Props = $props();
	const data = writable<Record<string, number>>({});
	let max = $state(0);

	onMount(() => {
		FIRST.getSummary(event.tba.key, 2025, {
			cacheExpires: tomorrow(),
		}).then(async (res) => {
			const teams = await event.getTeams(false, tomorrow());
			if (teams.isErr()) return console.error(teams.error);

			max = teams.value.length;

			if (res.isOk()) {
				const ranking = res.value.getRanking(team.tba.team_number);
				if (ranking) {
					const rendered: Record<string, number> = {};

					for (const [group, value] of Object.entries(ranking)) {
						for (const [name, rank] of Object.entries(value)) {
							rendered[group + ': ' + name] = rank;
						}
					}

					data.set(rendered);
				} else {
					console.error('No team found in event summary: ', team.tba.team_number, event.tba.key);
				}
			}
		});
	});
</script>

<RadarChart 
	{team}
	data={$data}
	opts={{
		max,
		min: 0,
	}}
/>
