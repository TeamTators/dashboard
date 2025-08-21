<script lang="ts">
	import { FIRST } from '$lib/model/FIRST';
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import Grid from '../general/Grid.svelte';
	import type { INumberFilterParams, ITextFilterParams } from 'ag-grid-community';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBAMatch, TBATeam } from 'tatorscout/tba';
	import { prompt } from '$lib/utils/prompts';
	import { Account } from '$lib/model/account';

	interface Props {
		scouting: Scouting.MatchScoutingData;
		style?: string;
	}

	const { scouting, style }: Props = $props();
	let team = $state(scouting.data.team);
	let event = $state(scouting.data.eventKey);
	let comments = $state(new DataArr(Scouting.TeamComments, []));

	let render = $state(0);

	onMount(() => {
		comments = Scouting.TeamComments.fromProperty(
			'matchScoutingId',
			String(scouting.data.id),
			false
		);

		render++;

		return comments.subscribe(() => {
			// Yes, this is a hack. I don't want to do the right way when this works.
			render++;
		});
	});

	const self = Account.getSelf();

	const comment = async () => {
		const c = await prompt('Enter a comment', {
			multiline: true
		});
		if (!c) return;
		Scouting.TeamComments.new({
			matchScoutingId: String(scouting.data.id),
			comment: c,
			eventKey: String(event),
			scoutUsername: String(self.get().data.username),
			team: Number(team),
			type: 'general',
			accountId: String(self.get().data.id)
		})
			.then(() => {
				render++;
			})
			.catch((e) => {
				console.error(e);
				alert('Failed to add comment');
			});
	};
</script>

<div class="h-85 w-100" {style}>
	<button type="button" class="btn btn-primary" onclick={comment}>
		<i class="material-icons">add</i>
		Add Comment
	</button>
	{#key render}
		<Grid
			rowNumbers={true}
			opts={{
				columnDefs: [
					{
						headerName: 'Comment',
						field: 'data.comment',
						filter: 'agTextColumnFilter'
					},
					{
						headerName: 'Account',
						field: 'data.scoutUsername',
						filter: 'agTextColumnFilter'
					},
					{
						headerName: 'Type',
						field: 'data.type',
						filter: 'agTextColumnFilter'
					}
				]
			}}
			data={comments}
			height={400}
		/>
	{/key}
</div>

<style>
	.h-85 {
		height: 85%;
	}
</style>
