<script lang="ts">
	import { goto } from '$app/navigation';
	import { Strategy } from '$lib/model/strategy';
	import { contextmenu } from '$lib/utils/contextmenu';
	import { confirm } from '$lib/utils/prompts';
	import Grid from '../general/Grid.svelte';

	interface Props {
		strategies: Strategy.StrategyArr;
		height?: number;
	}

	const { strategies, height }: Props = $props();
</script>

<p class="text-muted text-small">Double click on a strategy to view or edit it.</p>
<Grid
	data={strategies}
	opts={{
		columnDefs: [
			{ field: 'data.name', headerName: 'Name', flex: 1 },
			{ field: 'data.notes', headerName: 'Notes', flex: 2 },
			{ field: 'data.compLevel', headerName: 'Comp Level', flex: 1 },
			{ field: 'data.matchNumber', headerName: 'Match Number', flex: 1 },
			{ field: 'data.created', headerName: 'Created', flex: 1 },
			{ field: 'data.updated', headerName: 'Updated', flex: 1 }
		],
		onRowDoubleClicked: (params) => {
			if (!params.data) return;
			goto(`/dashboard/event/${params.data.data.eventKey}/strategy/${params.data.data.id}`);
		},
		preventDefaultOnContextMenu: true,
		onCellContextMenu: (params) => {
			if (!params.data) return;
			const strategy = params.data;
			contextmenu(params.event as PointerEvent, {
				options: [
					{
						name: 'View/Edit',
						action: () => {
							goto(`/dashboard/event/${strategy.data.eventKey}/strategy/${strategy.data.id}`);
						},
						icon: {
							type: 'material-icons',
							name: 'edit'
						}
					},
					{
						name: 'Archive',
						action: async () => {
							if (
								await confirm(
									'Are you sure you want to archive this strategy? You can restore it later from the archived strategies viewer.'
								)
							) {
								strategy.setArchive(true);
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
		}
	}}
	height={`${height ?? 400}px`}
/>
