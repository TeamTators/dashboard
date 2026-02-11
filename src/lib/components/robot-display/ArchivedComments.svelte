<!--
@fileoverview Table view of archived team comments with restore actions.

@component ArchivedComments

@description
Renders a grid of archived comments and allows restoring a comment via a context menu action.

@example
```svelte
<ArchivedComments {team} {event} {comments} {scouting} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import Grid from '../general/Grid.svelte';
	import { confirm, notify } from '$lib/utils/prompts';
	import { writable, type Writable } from 'svelte/store';
	import { contextmenu } from '$lib/utils/contextmenu';
	import { NumberFilterModule, TextFilterModule } from 'ag-grid-community';

	interface Props {
		/** Team number for context. */
		team: number;
		/** Event key for context. */
		event: string;
		/** Archived comments to display. */
		comments: Scouting.TeamCommentsData[];
		/** Scouting data used to resolve match numbers. */
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { comments, scouting }: Props = $props();

	let commentProxy: Writable<
		{
			comment: Scouting.TeamCommentsData;
			match: string;
		}[]
	> = $derived(
		writable(
			comments.map((c) => {
				return {
					comment: c,
					match: String(
						scouting.data.find((s) => s.scouting.data.id === c.data.matchScoutingId)?.matchNumber ??
							'unknown'
					)
				};
			})
		)
	);
</script>

{#if comments.length > 0}
	<Grid
		rowNumbers={true}
		opts={{
			columnDefs: [
				{
					headerName: 'Comment',
					field: 'comment.data.comment',
					filter: 'agTextColumnFilter'
				},
				{
					headerName: 'Account',
					field: 'comment.data.scoutUsername',
					filter: 'agTextColumnFilter'
				},
				{
					headerName: 'Type',
					field: 'comment.data.type',
					filter: 'agTextColumnFilter'
				},
				{
					headerName: 'Match',
					field: 'match',
					filter: 'agNumberColumnFilter'
				}
			],
			onCellContextMenu: (e) => {
				contextmenu(e.event as PointerEvent, {
					options: [
						{
							name: 'Restore',
							action: async () => {
								if (!e.data) return;

								if (await confirm('Are you sure you want to restore this?')) {
									const res = await e.data.comment.setArchive(false);
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
											message: 'You successfully restored the comment.',
											title: 'Success',
											textColor: 'light',
											autoHide: 3000
										});
									}
								}
							},
							icon: {
								type: 'material-icons',
								name: 'history'
							}
						}
					],
					width: '150px'
				});
			},
			preventDefaultOnContextMenu: true
		}}
		height={400}
		data={commentProxy}
		modules={[NumberFilterModule, TextFilterModule]}
	/>
{/if}
