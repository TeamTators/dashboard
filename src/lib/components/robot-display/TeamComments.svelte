<script lang="ts">
	import { FIRST } from '$lib/model/FIRST';
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import Grid from '../general/Grid.svelte';
	import type { INumberFilterParams, ITextFilterParams } from 'ag-grid-community';
	import { onMount } from 'svelte';
	import { Account } from '$lib/model/account';
	import { alert, prompt, confirm, notify } from '$lib/utils/prompts';
	import { writable, type Writable } from 'svelte/store';
	import { contextmenu } from '$lib/utils/contextmenu';

	interface Props {
		team: number;
		event: string;
		comments: Scouting.TeamCommentsArr;
		scouting: Scouting.MatchScoutingArr;
	}

	const { team, event, comments, scouting }: Props = $props();

	let commentProxy: Writable<
		{
			comment: Scouting.TeamCommentsData;
			match: string;
		}[]
	> = $state(writable([]));

	onMount(() => {
		return comments.subscribe((data) => {
			commentProxy.set(
				data.map((c) => {
					const match = scouting.data.find((s) => s.data.id === c.data.matchScoutingId);
					return {
						comment: c,
						match: match ? `${match.data.compLevel}${match.data.matchNumber}` : 'unknown'
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
			scoutUsername: String(self.get().data.username),
			team: Number(team),
			type: 'general',
			accountId: String(self.get().data.id)
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
							name: 'Archive',
							action: async () => {
								console.log(e);
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
										if (res.value.success) {
											notify({
												color: 'success',
												message: 'You successfully archived the comment.',
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
								name: 'archive'
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
	/>
</div>

<style>
	.h-85 {
		height: 85%;
	}
</style>
