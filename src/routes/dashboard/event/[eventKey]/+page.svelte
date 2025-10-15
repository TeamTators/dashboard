<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { Dashboard } from '$lib/model/dashboard';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import EventSummary from '$lib/components/charts/EventSummary.svelte';
	import { Scouting } from '$lib/model/scouting.js';
	import { alert, confirm } from '$lib/utils/prompts.js';
	import { Subscription } from '$lib/model/subscription';
	const { data = $bindable() } = $props();
	const event = $derived(data.event);
	const teams = $derived(data.teams);
	const matches = $derived(data.matches);
	const summaries = $derived(data.summaries);

	$effect(() => nav(event));

	const dashboard = $derived(
		new Dashboard.Dashboard({
			name: event.name,
			cards: [],
			id: 'event-dashboard'
		})
	);

	const eventSummaries: {
		component: EventSummary | undefined;
	}[] = $derived(
		summaries
			.map((s) => s.labels)
			.flat() // now the length is number of rows * number of labels per row, hence we can index it with k * i
			.map(() => ({
				component: undefined as EventSummary | undefined
			}))
	);
</script>

<DB {dashboard}>
	{#snippet body()}
		<div class="d-flex w-100" style="gap: 10px;">
			<a
				href="https://docs.google.com/spreadsheets/d/1ntbCYyqMxMLbD6R0rVxfx_sIgq0mrYtXbbh2Wb5iuok/edit?gid=722231706#gid=722231706"
				type="button"
				target="_blank"
				class="btn btn-primary link-button"
			>
				Go to Picklist Spreadsheet
			</a>
			<button
				type="button"
				class="btn btn-secondary link-button"
				onclick={async () => {
					if (
						await confirm(
							'This will send you notifications for every match the Tators are in at this event before the match starts. Do you want to continue?'
						)
					) {
						const res = await Subscription.subscribe('tator_matches', event.key);

						if (res.isErr()) {
							alert('Unable to subscribe: ' + res.error.message);
						} else {
							if (!res.value.success) {
								alert('Unable to subscribe: ' + res.value.message);
							}
						}
					}
				}}
			>
				Subscribe to Tator Matches
			</button>
		</div>
		<div style="grid-column: span var(--grid-size);">
			<div class="ws-nowrap p-3 scroll-x" style="width: 100% !important;">
				{#each teams as team}
					<a
						href="/dashboard/event/{event.key}/team/{team.team_number}"
						type="button"
						class="btn btn-primary mx-2"
					>
						{team.team_number}
					</a>
				{/each}
			</div>
			<div class="container-fluid">
				<div class="row mb-3">
					<div class="col">
						<div class="d-flex">
							<button
								type="button"
								class="btn btn-warning me-2"
								onclick={async () => {
									if (await confirm('Are you sure you want to archive all practice matches?')) {
										Scouting.setPracticeArchive(event.key, true);
									}
								}}
							>
								Archive All Practice Matches
							</button>
							<button
								type="button"
								class="btn btn-warning me-2"
								onclick={async () => {
									if (await confirm('Are you sure you want to unarchive all practice matches?')) {
										Scouting.setPracticeArchive(event.key, false);
									}
								}}
							>
								Unarchive All Practice Matches
							</button>
						</div>
					</div>
				</div>
				{#each summaries as row, k}
					<div class="row mb-5">
						{#if k !== 0}
							<hr />
						{/if}
						<h2 class="text-primary">{row.title}</h2>
						{#each row.labels as label, i}
							<div class="d-flex align-items-center mb-1 justify-content-between">
								<h5>{label}</h5>
								<button
									type="button"
									class="btn btn-sm btn-secondary ms-2"
									onclick={() => {
										if (eventSummaries[k * i].component) {
											eventSummaries[k * i].component?.copy(true);
										}
									}}
								>
									<i class="material-icons">copy_all</i>
								</button>
							</div>
							<div class="scroll-x mb-1">
								<div class="chart-container">
									<EventSummary
										bind:this={eventSummaries[k * i].component}
										labels={Object.entries(row.data)
											.sort((a, b) => {
												const A = a[1][i];
												const B = b[1][i];
												if (isNaN(A)) {
													return 1;
												}
												if (isNaN(B)) {
													return -1;
												}
												return B - A;
											})
											.map((v) => v[0])}
										datasets={[
											{
												label,
												data: Object.entries(row.data)
													.sort((a, b) => {
														const A = a[1][i];
														const B = b[1][i];
														if (isNaN(A)) {
															return 1;
														}
														if (isNaN(B)) {
															return -1;
														}
														return B - A;
													})
													.map((v) => v[1][i])
											}
										]}
									/>
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/snippet}
</DB>

<style>
	.chart-container {
		min-width: 1500px !important;
		width: 100vw;
		height: 100%;
	}

	.link-button {
		max-width: 50%;
		width: 120px;
	}
</style>
