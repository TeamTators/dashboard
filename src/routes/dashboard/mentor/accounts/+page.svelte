<script lang="ts">
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import type { Account } from '$lib/model/account.js';
	import { confirm } from '$lib/utils/prompts.js';
	import '$lib/defaults/mentor';

	const { data } = $props();
	const accounts = data.accounts;

	const refresh = () => goto(`/dashboard/mentor/accounts`);
	// let roleModal: Modal;
	// let selectedAccount: Account.AccountData | undefined = $state(undefined);
</script>

<div class="table-responsive">
	<table class="table table-striped">
		<thead>
			<tr>
				<td>Username</td>
				<td>Name</td>
				<td>Email</td>
				<!-- <td>Roles</td> -->
				<td>Actions</td>
			</tr>
		</thead>
		<tbody>
			{#each accounts as account}
				<tr 
				>
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
							<span class="badge bg-primary">{role.data.name}</span>
						{/each}
					</td> -->
					<td>
						<div role="group" class="btn-group">
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
<!-- 
<Modal bind:this={roleModal}
	title="Edit Roles"
	size="lg"

>
{#snippet body()}
	{#if selectedAccount}
		Account modal
	{:else}
		<p>
			Please select an account to edit roles.
		</p>
	{/if}
{/snippet}
{#snippet buttons()}
{/snippet}
</Modal> -->