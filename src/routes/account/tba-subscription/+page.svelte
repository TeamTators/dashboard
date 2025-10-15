<script lang="ts">
	import Grid from '$lib/components/general/Grid.svelte';
	import { Account } from '$lib/model/account.js';
	import { Subscription } from '$lib/model/subscription.js';
	import { contextmenu } from '$lib/utils/contextmenu.js';
	import { alert, notify } from '$lib/utils/prompts.js';

	const { data } = $props();
	const account = $derived(Account.Account.Generator(data.account));
	const subscriptions = $derived(
		Subscription.WebhookSubscription.arr(
			data.subscriptions.map((s) => Subscription.WebhookSubscription.Generator(s)),
			(s) => s.data.accountId === account.data.id
		)
	);
</script>

<svelte:head>
	<title>My Subscriptions - {$account.username}</title>
</svelte:head>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h2>Subscription Details</h2>
		</div>
	</div>
	<div class="row mb-3">
		<Grid
			data={subscriptions}
			opts={{
				columnDefs: [
					{
						field: 'data.type',
						headerName: 'Type'
					},
					{
						field: 'data.args',
						headerName: 'Arguments'
					},
					{
						field: 'data.created',
						headerName: 'Created At',
						valueFormatter: (params) =>
							params.value ? new Date(params.value).toLocaleString() : 'Invalid Date'
					}
				],
				onRowDoubleClicked: (event) => {
					window.location.href = `/account/tba-subscription/${event.data?.data.id}`;
				},
				onCellContextMenu: (event) => {
					contextmenu(event.event as MouseEvent, {
						options: [
							{
								name: 'View Details',
								action: () => {
									window.location.href = `/account/tba-subscription/${event.data?.data.id}`;
								},
								icon: {
									type: 'material-icons',
									name: 'info'
								}
							},
							{
								name: 'Unsubscribe',
								action: async () => {
									if (!event.data) return;
									const res = await Subscription.unsubscribe(event.data);
									if (res.isErr()) {
										console.error(res.error);
										alert('Error: Failed to unsubscribe. Please try again later.');
									} else {
										notify({
											color: 'info',
											message: 'Successfully unsubscribed.',
											title: 'Subscription',
											autoHide: 3000
										});
									}
								},
								icon: {
									type: 'material-icons',
									name: 'delete'
								}
							}
						],
						width: '150px'
					});
				},
				preventDefaultOnContextMenu: true
			}}
			height="800px"
			rowNumbers={true}
		/>
	</div>
</div>
