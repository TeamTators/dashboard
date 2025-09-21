<script lang="ts">
	import { Scouting } from '$lib/model/scouting.js';
	import { contextmenu } from '$lib/utils/contextmenu.js';
	import { alert, confirm, notify } from '$lib/utils/prompts.js';
	import { onMount } from 'svelte';
	import { dateTime } from 'ts-utils/clock';

	const { data } = $props();

	const sessions = $derived(
		Scouting.PIT.AnswerSessions.arr(
			data.sessions.map((s) => Scouting.PIT.AnswerSessions.Generator(s)),
			(d) => d.data.section === data.section
		)
	);

	const archived = $derived(
		Scouting.PIT.AnswerSessions.arr(
			data.archived.map((s) => Scouting.PIT.AnswerSessions.Generator(s)),
			(d) => d.data.section === data.section
		)
	);
</script>

<div class="container">
	<div class="row mb-3">
		{#each $sessions as session, i}
			<div class="col-12 mb-3">
				<a
					href="/dashboard/event/{data.eventKey}/pit-scouting/{data.section}/team/{data.team}/{session
						.data.id}"
					class="
						text-decoration-none
						text-reset
						w-100
					"
				>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="card w-100"
						oncontextmenu={(e) => {
							e.preventDefault();
							contextmenu(e, {
								options: [
									'Manage Submission',
									{
										name: 'Archive',
										icon: {
											type: 'material-icons',
											name: 'archive'
										},
										action: async () => {
											if (
												await confirm('Are you sure you want to archive this whole submission?')
											) {
												const res = await session.setArchive(true);
												if (res.isErr()) {
													return alert('Error archiving submission:' + res.error.message);
												} else {
													if (res.value.success) {
														notify({
															autoHide: 3000,
															color: 'success',
															message: 'Archived submission',
															title: 'Archived'
														});
													} else {
														return alert('Error archiving submission:' + res.value.message);
													}
												}
											}
										}
									}
								],
								width: '150px'
							});
						}}
					>
						<div class="card-body bg-secondary">
							<h5 class="card-title">
								Submission {i + 1}
							</h5>
							<p class="card-text">
								Created: {dateTime(session.data.created)}
								<br />
								Created By: {session.data.createdBy}
							</p>
						</div>
					</div>
				</a>
			</div>
		{/each}
		<div class="col-12 mb-3">
			<form action="?/new-session" method="POST">
				<button class="btn w-100" type="submit">
					<div class="card w-100">
						<div class="card-body bg-primary">
							<h5 class="card-title">New Submission</h5>
						</div>
					</div>
				</button>
			</form>
		</div>
	</div>
	<hr />
	<div class="row mb-3">
		{#each $archived as session, i}
			<div class="col-12 mb-3">
				<button
					class="
						w-100
						btn
					"
					onclick={async () => {
						if (await confirm('Do you want to unarchive this submission?')) {
							const res = await session.setArchive(false);
							if (res.isErr()) {
								return alert('Error restoring submission: ' + res.error.message);
							} else {
								if (res.value.success)
									return (location.href = `/dashboard/event/${data.eventKey}/pit-scouting/${data.section}/team/${data.team}/${session.data.id}`);
								else alert('Error restoring submission: ' + res.value.message);
							}
						}
					}}
				>
					<div class="card w-100">
						<div class="card-body bg-secondary">
							<h5 class="card-title">
								Submission {i + 1}
							</h5>
							<p class="card-text">
								Created: {dateTime(session.data.created)}
								<br />
								Created By: {session.data.createdBy}
							</p>
						</div>
					</div>
				</button>
			</div>
		{/each}
	</div>
</div>
