<!--
@fileoverview Team-level comments grid with archive actions.

@component TeamComments

@description
Displays all team comments in a grid with context-menu actions to archive entries and
supports adding new comments.

@example
```svelte
<TeamComments {team} {event} {comments} {scouting} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import Grid from '../general/Grid.svelte';
	import { onMount } from 'svelte';
	import { Account } from '$lib/model/account';
	import { alert, prompt, confirm, notify } from '$lib/utils/prompts';
	import { contextmenu } from '$lib/utils/contextmenu';
	import { RowAutoHeightModule, TextFilterModule, NumberFilterModule } from 'ag-grid-community';
	import { WritableArray } from '$lib/services/writables';

	interface Props {
		/** Team number for comment scoping. */
		team: number;
		/** Event key for comment scoping. */
		event: string;
		/** Comment store for the team. */
		comments: Scouting.TeamCommentsArr;
		/** Scouting data used to resolve match labels. */
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { team, event, comments, scouting }: Props = $props();

	const commentProxy = new WritableArray<{
		comment: Scouting.TeamCommentsData;
		match: string;
	}>([]);

	onMount(() => {
		return comments.subscribe((data) => {
			commentProxy.set(
				data.map((c) => {
					const match = scouting.data.find((s) => s.id === c.data.matchScoutingId);
					return {
						comment: c,
						match: match ? `${match.compLevel}${match.matchNumber}` : 'unknown'
					};
				})
			);
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
			scoutUsername: String(self.data.data.username),
			team: Number(team),
			type: 'general',
			accountId: String(self.data.data.id)
		}).catch((e) => {
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
	<Grid
		opts={{
			columnDefs: [
				{
					headerName: 'Comment',
					field: 'comment.data.comment',
					filter: 'agTextColumnFilter',
					wrapText: true,
					autoHeight: true,
					cellStyle: {
						'line-height': '1.4',
						'white-space': 'normal'
					}
				},
				{
					headerName: 'Account',
					field: 'comment.data.scoutUsername',
					filter: 'agTextColumnFilter',
					width: 150
				},
				{
					headerName: 'Type',
					field: 'comment.data.type',
					filter: 'agTextColumnFilter',
					width: 100
				},
				{
					headerName: 'Match',
					field: 'match',
					filter: 'agNumberColumnFilter',
					width: 120
				}
			],
			onCellContextMenu: (e) => {
				contextmenu(e.event as PointerEvent, {
					options: [
						{
							name: 'Archive',
							action: async () => {
								if (!e.data) return;

								if (await confirm('Are you sure you want to archive this?')) {
									const res = await e.data.comment.setArchive(true);
									if (res.isErr()) {
										notify({
											color: 'danger',
											message: 'There was an error, please contact a developer.',
											title: 'Error',
											textColor: 'light',
											autoHide: 3000
										});
									} else {
										notify({
											color: 'success',
											message: 'You successfully archived the comment.',
											title: 'Success',
											textColor: 'light',
											autoHide: 3000
										});
									}
								}
							},
							icon: {
								type: 'material-icons',
								name: 'archive'
							}
						}
					],
					width: '150px'
				});
			},
			preventDefaultOnContextMenu: true
		}}
		height="100%"
		data={commentProxy}
		modules={[RowAutoHeightModule, TextFilterModule, NumberFilterModule]}
	/>
</div>

<style>
	.h-85 {
		height: 85%;
	}
</style>
