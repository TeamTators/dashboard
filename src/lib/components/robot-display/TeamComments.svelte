<script lang="ts">
	import { FIRST } from '$lib/model/FIRST';
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import Grid from '../general/Grid.svelte';
	import type { INumberFilterParams, ITextFilterParams } from 'ag-grid-community';
	import { onMount } from 'svelte';
	import { Account } from '$lib/model/account';
	import { prompt } from '$lib/utils/prompts';
	import { writable, type Writable } from 'svelte/store';

	interface Props {
		team: number;
		event: string;
		comments: Scouting.TeamCommentsArr;
		scouting: Scouting.MatchScoutingArr;
	}

	const { team, event, comments, scouting }: Props = $props();

	let commentProxy: Writable<
		{
			comment: string;
			scoutUsername: string;
			type: string;
			match: string;
		}[]
	> = $state(writable([]));

	let render = $state(0);

	onMount(() => {
		render++;

		return comments.subscribe((data) => {
			commentProxy.set(
				data.map((c) => {
					const match = scouting.data.find((s) => s.data.id === c.data.matchScoutingId);
					return {
						comment: String(c.data.comment),
						scoutUsername: String(c.data.scoutUsername),
						type: String(c.data.type),
						match: match ? `${match.data.compLevel}${match.data.matchNumber}` : 'unknown'
					};
				})
			);
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
			matchScoutingId: '',
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

<div class="h-85 w-100">
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
						field: 'comment',
						filter: 'agTextColumnFilter'
					},
					{
						headerName: 'Account',
						field: 'scoutUsername',
						filter: 'agTextColumnFilter'
					},
					{
						headerName: 'Type',
						field: 'type',
						filter: 'agTextColumnFilter'
					},
					{
						headerName: 'Match',
						field: 'match',
						filter: 'agNumberColumnFilter'
					}
				]
			}}
			height={400}
			data={commentProxy}
		/>
	{/key}
</div>

<style>
	.h-85 {
		height: 85%;
	}
</style>
