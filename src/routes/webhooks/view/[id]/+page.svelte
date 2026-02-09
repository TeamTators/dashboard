<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	const { data } = $props();
	const alert = $derived(data.alert);

	const alertData: any = $derived(JSON.parse(alert.data));
</script>

<div class="container d-flex flex-column align-items-center justify-content-center vh-100">
	<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
		{#if alert.type === 'upcoming_match'}
			<h5 class="card-title">Upcoming Match Alert</h5>
			<p class="card-text">A match is scheduled to start soon.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item"><strong>Match:</strong> {alertData.match_key}</li>
				<li class="list-group-item">
					<strong>Start Time:</strong>
					{new Date(alertData.predicted_time).toLocaleString()}
				</li>
			</ul>
		{:else if alert.type === 'match_score'}
			<h5 class="card-title">Match Score Alert</h5>
			<p class="card-text">A match score has been updated.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item">
					<strong>Match:</strong>
					{alertData.event_name}
					{alertData.match.comp_level}
					{alertData.match.match_number}
				</li>
				<li class="list-group-item">
					<strong>Team Red Score:</strong>
					{alertData.match.alliances.red.score}
				</li>
				<li class="list-group-item">
					<strong>Team Blue Score:</strong>
					{alertData.match.alliances.blue.score}
				</li>
				<!-- <li class="list-group-item"><strong>View:</strong> <a href="https://thebluealliance.com/match/{alertData.match.key}">View Match</a></li> -->
			</ul>
		{:else if alert.type === 'starting_comp_level'}
			<h5 class="card-title">Starting Competition Level Alert</h5>
			<p class="card-text">A new competition level is starting.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item"><strong>Competition Level:</strong> {alertData.comp_level}</li>
				<li class="list-group-item">
					<strong>Start Time:</strong>
					{new Date(alertData.scheduled_time).toLocaleString()}
				</li>
			</ul>
		{:else if alert.type === 'alliance_selection'}
			<h5 class="card-title">Alliance Selection Alert</h5>
			<p class="card-text">Alliance selection has begun.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item"><strong>Event:</strong> {alertData.event_name}</li>
			</ul>
		{:else if alert.type === 'schedule_updated'}
			<h5 class="card-title">Schedule Updated Alert</h5>
			<p class="card-text">The match schedule has been updated.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item"><strong>Event:</strong> {alertData.event_name}</li>
			</ul>
		{:else if alert.type === 'broadcast'}
			<h5 class="card-title">Broadcast Alert</h5>
			<p class="card-text">A new broadcast has been announced.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item"><strong>Event Key:</strong> {alertData.title}</li>
				<li class="list-group-item"><strong>Description:</strong> {alertData.desc}</li>
				<li class="list-group-i">
					<strong>Url:</strong> <a href={alertData.url} target="_blank">{alertData.url}</a>
				</li>
			</ul>
		{:else if alert.type === 'match_video'}
			<h5 class="card-title">Match Video Alert</h5>
			<p class="card-text">A new match video has been uploaded.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item">
					<strong>Match:</strong>
					{alertData.match.comp_level}
					{alertData.match.match_number}
				</li>
				{#each alertData.match.videos as video}
					{#if video.type === 'youtube'}
						<li class="list-group-item">
							<strong>Video:</strong>
							<a href="https://www.youtube.com/watch?v={video.key}" target="_blank">YouTube Video</a
							>
						</li>
					{:else if video.type === 'twitch'}
						<li class="list-group-item">
							<strong>Video:</strong>
							<a href="https://www.twitch.tv/videos/{video.key}" target="_blank">Twitch Video</a>
						</li>
					{:else}
						<li class="list-group-item"><strong>Unknown Video</strong></li>
					{/if}
				{/each}
			</ul>
		{:else}
			<h5 class="card-title">Unknown Alert Type</h5>
			<p class="card-text">The alert type is not recognized.</p>
			<ul class="list-group list-group-flush">
				<li class="list-group-item"><strong>Data:</strong> {alert.data}</li>
			</ul>
		{/if}
	</div>
</div>
