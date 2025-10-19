<script lang="ts">
	import { Picklist } from '$lib/model/picklist';

	interface Props {
		picklist: Picklist.PicklistData;
		team: Picklist.PicklistTeamData;
		changes: Picklist.PicklistChangeData[];
	}

	const { changes }: Props = $props();

	const up = $derived(changes.filter((c) => String(c.data.direction).toLowerCase() === 'up'));
	const down = $derived(changes.filter((c) => String(c.data.direction).toLowerCase() === 'down'));
</script>

<div class="container-fluid">
	{#if changes.length}
		<div class="row mb-3">
			<h3>{changes.length} vote{changes.length > 1 ? 's' : ''} recorded.</h3>
		</div>

		<br />
		<div class="row mb-3">
			<h4>Up Votes: <span class="text-success">{up.length}</span></h4>
		</div>

		{#each up as upvote}
			<div class="row mb-3">
				<div class="col">
					<div class="card">
						<div class="card-body">
							<strong>{upvote.data.addedByUsername}</strong> voted
							<span class="text-success">UP</span>
							{upvote.data.created?.toLocaleString()}
							{#if upvote.data.reason}
								<br />
								Reason: {upvote.data.reason}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}

		<br />

		<div class="row mb-3">
			<h4>Down Votes: <span class="text-danger">{down.length}</span></h4>
		</div>

		{#each down as downvote}
			<div class="row mb-3">
				<div class="col">
					<div class="card">
						<div class="card-body">
							<strong>{downvote.data.addedByUsername}</strong> voted
							<span class="text-danger">DOWN</span>
							{downvote.data.created?.toLocaleString()}
							{#if downvote.data.reason}
								<br />
								Reason: {downvote.data.reason}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	{:else}
		<div class="row mb-3">
			<div class="col">No votes to display.</div>
		</div>
	{/if}
</div>
