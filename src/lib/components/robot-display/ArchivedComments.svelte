<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import Grid from '../general/Grid.svelte';
	import { onMount } from 'svelte';
	import { confirm, notify } from '$lib/utils/prompts';
	import { writable, type Writable } from 'svelte/store';
	import { contextmenu } from '$lib/utils/contextmenu';
	import { NumberFilterModule, TextFilterModule } from 'ag-grid-community'; 

	interface Props {
		team: number;
		event: string;
		comments: Scouting.TeamCommentsData[];
		scouting: Scouting.MatchScoutingData[];
	}

	const { team, event, comments, scouting }: Props = $props();

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
						scouting.find((s) => s.data.id === c.data.matchScoutingId)?.data.matchNumber ??
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
										if (res.value.success) {
											notify({
												color: 'success',
												message: 'You successfully restored the comment.',
												title: 'Success',
												textColor: 'light',
												autoHide: 3000
											});
										} else {
											notify({
												color: 'warning',
												message: res.value.message || 'Unknown issue',
												title: 'Not Archived',
												textColor: 'dark',
												autoHide: 3000
											});
										}
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
