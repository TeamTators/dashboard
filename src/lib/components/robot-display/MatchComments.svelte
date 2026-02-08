<!--
@fileoverview Comment list and editor for a single match scouting record.

@component MatchComments

@description
Loads comments tied to a match scouting record, renders them in a grid, and allows
adding new comments via a prompt.

@example
```svelte
<MatchComments {scouting} style="height: 400px;" />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import Grid from '../general/Grid.svelte';
	import { onMount } from 'svelte';
	import { prompt } from '$lib/utils/prompts';
	import { Account } from '$lib/model/account';
	import { tomorrow } from 'ts-utils';
	// import { TextFilterModule } from 'ag-grid-community';

	interface Props {
		/** Match scouting record whose comments are displayed. */
		scouting: Scouting.MatchScoutingExtended;
		/** Optional inline style for container sizing. */
		style?: string;
	}

	const { scouting, style }: Props = $props();
	let team = $derived(scouting.team);
	let event = $derived(scouting.eventKey);
	let comments = $state(new DataArr(Scouting.TeamComments, []));

	let render = $state(0);

	onMount(() => {
		comments = Scouting.TeamComments.get(
			{ matchScoutingId: String(scouting.scouting.data.id) },
			{
				type: 'all',
				cache: {
					expires: tomorrow()
				}
			}
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
			matchScoutingId: String(scouting.scouting.data.id),
			comment: c,
			eventKey: String(event),
			scoutUsername: String(self.data.data.username),
			team: Number(team),
			type: 'general',
			accountId: String(self.data.data.id)
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
