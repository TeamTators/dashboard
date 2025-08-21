<script lang="ts">
	import nav from '$lib/imports/robot-display';
	const { data } = $props();
	const event = $derived(data.event);
	const checklist = $derived(data.data);

	$effect(() => nav(event.tba));
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h1>Checklists for {event.tba.name}</h1>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<h4>Pictures</h4>
		</div>
	</div>
	<div class="row mb-3">
		{#each checklist as item}
			<div class="col">
				<h4 class:text-danger={item.tbaPictures + item.uploaded === 0}>
					{item.team.tba.team_number}
					{item.team.tba.nickname}
				</h4>
				<ul class="list">
					<li class="list-group-item">
						TBA: {item.tbaPictures}
					</li>
					<li class="list-group-item">
						Uploaded: {item.uploaded}
					</li>
				</ul>
			</div>
		{/each}
	</div>
	<hr />
	<div class="row mb-3">
		<div class="col">
			<h4>Pit Scouting</h4>
		</div>
	</div>
	<div class="row mb-3">
		{#each checklist as item}
			{#if item.left.data.length}
				<div class="col">
					<h4>{item.team.tba.team_number} {item.team.tba.nickname} ({item.left.data.length})</h4>
					<ul class="list-group">
						{#each item.left.data as question}
							<li class="list-group text-danger">
								<pre>{question.data.key}</pre>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/each}
	</div>
</div>
