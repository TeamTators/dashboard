<!--
@component
Mentor accounts management table.

Displays users, verification status, and action controls for account updates.
-->
<script lang="ts">
	import { confirm, alert } from '$lib/utils/prompts.js';
	import { capitalize, fromSnakeCase } from 'ts-utils/text';

	const { data } = $props();
	const accounts = $derived(data.accounts);
	// const roles = $derived(data.roles);

	const refresh = () => {
		location.reload();
	};

	// const roleColors = {
	// 	Member: 'primary',
	// 	Scout: 'info',
	// 	Admin: 'warning',
	// 	Mentor: 'success'
	// };
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<h1>Mentor Dashboard</h1>
	</div>

	<div class="row mb-3">
		<div class="table-responsive">
			<table class="table table-striped">
				<thead>
					<tr>
						<td>Username</td>
						<td>Name</td>
						<td>Email</td>
						<td>Roles</td>
						<td>Actions</td>
					</tr>
				</thead>
				<tbody>
					{#each accounts as account}
						<tr>
							<td>
								<p
									class:text-danger={!account.account.data.verified}
									class:text-info={account.admin}
									class:text-success={account.developer}
								>
									{account.account.data.username}
								</p>
							</td>
							<td><p>{account.account.data.firstName} {account.account.data.lastName}</p></td>
							<td><p>{account.account.data.email}</p></td>
							<!-- <td>
								{#each account.roles as role}
									<span
										class="badge bg-{roleColors[role.data.name as keyof typeof roleColors]} me-2"
										>{role.data.name}</span
									>
								{/each}
							</td> -->
							<td>
								<div role="group" class="btn-group">
									<button
										type="button"
										class="btn btn-primary"
										onclick={async () => {
											// const rolesLeft = roles.filter(
											// 	(r) => !account.roles.find((ar) => ar.data.id === r.data.id)
											// );
											// const data = await select(
											// 	'Select a role',
											// 	rolesLeft.map((r) => r.data.name)
											// );
											// if (data) {
											// 	const role = roles.find((r) => r.data.name === data);
											// 	if (role) {
											// 		const roleId = role.data.id;
											// 		const accountId = account.account.data.id;
											// 		if (roleId && accountId) {
											// 			Permissions.grantRole(roleId, accountId).then(refresh);
											// 		}
											// 	}
											// }
										}}
									>
										<i class="material-icons"> group_add </i>
									</button>
									<button
										type="button"
										class="btn btn-warning"
										onclick={async () => {
											// const data = await select(
											// 	'Select a role',
											// 	account.roles.map((r) => r.data.name)
											// );
											// if (data) {
											// 	const role = roles.find((r) => r.data.name === data);
											// 	if (role) {
											// 		const roleId = role.data.id;
											// 		const accountId = account.account.data.id;
											// 		if (roleId && accountId) {
											// 			Permissions.revokeRole(roleId, accountId).then(refresh);
											// 		}
											// 	}
											// }
										}}
									>
										<i class="material-icons"> group_remove </i>
									</button>
									<button
										type="button"
										class="btn btn-info"
										onclick={() => {
											alert(
												`Entitlements: <br>${account.entitlements.map((e) => `<span class="ps-3">${capitalize(fromSnakeCase(e, '-'))}<span/>`).join('<br>')}`
											);
										}}
									>
										<i class="material-icons"> visibility </i>
									</button>
									{#if account.account.data.verified}
										<button
											class="btn btn-warning"
											onclick={async () => {
												if (
													await confirm(
														`Are you sure you want to unverify ${account.account.data.username}?`
													)
												) {
													account.account.update((d) => ({ ...d, verified: false })).then(refresh);
												}
											}}
										>
											<i class="material-icons"> block </i>
										</button>
									{:else}
										<button
											class="btn btn-success"
											onclick={async () => {
												if (
													await confirm(
														`Are you sure you want to verify ${account.account.data.username}?`
													)
												) {
													account.account.update((d) => ({ ...d, verified: true })).then(refresh);
												}
											}}
										>
											<i class="material-icons"> check </i>
										</button>
									{/if}
									<button
										class="btn btn-danger"
										onclick={async () => {
											if (
												await confirm(
													`Are you sure you want to delete ${account.account.data.username}?`
												)
											) {
												account.account.delete().then(refresh);
											}
										}}
									>
										<i class="material-icons"> delete </i>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
