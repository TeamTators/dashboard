<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import { Webhooks } from '$lib/model/webhooks';
	import { Account } from '$lib/model/account';
	import { onDestroy, onMount } from 'svelte';
	import Grid from '$lib/components/general/Grid.svelte';
	import { freqEst, getDesc } from '$lib/utils/webhooks';
	import { ButtonCellRenderer } from '$lib/utils/ag-grid/buttons';
	import { capitalize, fromSnakeCase } from 'ts-utils';
	import { useCommandStack } from '$lib/services/event-stack';
	import { type ICellRendererParams } from 'ag-grid-community';
	import { contextmenu } from '$lib/utils/contextmenu';
	import { CheckboxEditorModule } from 'ag-grid-community';

	let subscriptions = $state(Webhooks.Subscriptions.arr());

	const cs = useCommandStack('account:webhooks', onMount, onDestroy);

	onMount(() => {
		Account.getSelfAsync().then((s) => {
			if (s.isOk()) {
				subscriptions = Webhooks.Subscriptions.fromProperty('accountId', String(s.value.data.id), {
					type: 'all'
				});
			}
		});
	});
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h2>Subscriptions</h2>
			<p>
				<small class="text-muted">
					Manage your subscriptions here. Right-click on a subscription for more actions.
				</small>
			</p>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			{#key subscriptions}
				<Grid
					data={subscriptions}
					opts={{
						columnDefs: [
							{
								headerName: 'Type',
								width: 150,
								// field: 'data.type',
								valueGetter: (params) => capitalize(fromSnakeCase(String(params.data?.data.type)))
							},
							{
								headerName: 'Args',
								width: 150,
								valueGetter: (params) =>
									capitalize(fromSnakeCase(String(params.data?.data.args).split(':').join(', ')))
							},
							{
								headerName: 'Send Email',
								field: 'data.email',
								width: 120,
								editable: true,
								valueSetter: (params) => {
									cs.execute({
										label: 'Toggle Send Email',
										do: () => {
											params.data.update((d) => {
												return {
													...d,
													email: !d.email
												};
											});
										},
										undo: () => {
											params.data.update((d) => {
												return {
													...d,
													email: !d.email
												};
											});
										}
									});
									return true;
								}
							},
							{
								headerName: 'Popup',
								field: 'data.popup',
								width: 100,
								editable: true,
								valueSetter: (params) => {
									cs.execute({
										label: 'Toggle Send Email',
										do: () => {
											params.data.update((d) => {
												return {
													...d,
													popup: !d.popup
												};
											});
										},
										undo: () => {
											params.data.update((d) => {
												return {
													...d,
													popup: !d.popup
												};
											});
										}
									});
									return true;
								}
							},
							// {
							//     headerName: 'Discord Message',
							//     field: 'data.discord',
							//     editable: true,
							//     width: 130,
							//     valueSetter: (params) => {
							//         cs.execute({
							//             label: 'Toggle Send Email',
							//             do: () => {
							//                 params.data.update((d) => {
							//                     return {
							//                         ...d,
							//                         discord: !d.discord,
							//                     };
							//                 })
							//             },
							//             undo: () => {
							//                 params.data.update((d) => {
							//                     return {
							//                         ...d,
							//                         discord: !d.discord,
							//                     };
							//                 })
							//             },
							//         });
							//         return true;
							//     }
							// },
							{
								headerName: 'Est. Freq.',
								width: 150,
								valueGetter: (params) =>
									freqEst(String(params.data?.data.type), String(params.data?.data.args))
							},
							{
								headerName: 'Description',
								width: 500,
								valueGetter: (params) =>
									getDesc(String(params.data?.data.type), String(params.data?.data.args))
							},
							{
								headerName: 'Date Created',
								width: 200,
								valueGetter: (params) => params.data?.data.created?.toLocaleString()
							}
						],
						onCellContextMenu: (params) => {
							contextmenu(params.event as PointerEvent, {
								options: [
									'Webhook Actions',
									{
										name: 'Cancel Subscription',
										action: () => {
											cs.execute({
												label: 'Delete Webhook Subscription',
												do: () => {
													params.data?.delete();
												},
												undo: () => {
													if (params.data) Webhooks.Subscriptions.new(params.data.data as any);
												}
											});
										},
										icon: {
											type: 'material-icons',
											name: 'delete'
										}
									},
									{
										name: 'Test',
										action: () => {
											window.open(`/webhooks/test/${params.data?.data.id}`);
										},
										icon: {
											type: 'material-icons',
											name: 'send'
										}
									}
								],
								width: '200px'
							});
						},
						preventDefaultOnContextMenu: true
					}}
					height="80vh"
					modules={[CheckboxEditorModule]}
				/>
			{/key}
		</div>
	</div>
</div>
