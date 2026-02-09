<div class="container py-4">
	<div class="row mb-3">
		<div class="col">
			<h1>Test Alert</h1>
			<p>This is a test alert to preview how different alert types will look when rendered.</p>
		</div>
	</div>
	<div class="row g-3">
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Upcoming Match Alert</h5>
				<p class="card-text">A match is scheduled to start soon.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Match:</strong> 2024miket_qm1</li>
					<li class="list-group-item">
						<strong>Start Time:</strong>
						{new Date(Date.now() + 15 * 60 * 1000).toLocaleString()}
					</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Match Score Alert</h5>
				<p class="card-text">A match score has been updated.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Match:</strong> Michigan District Event qm12</li>
					<li class="list-group-item"><strong>Team Red Score:</strong> 124</li>
					<li class="list-group-item"><strong>Team Blue Score:</strong> 118</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Starting Competition Level Alert</h5>
				<p class="card-text">A new competition level is starting.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Competition Level:</strong> Playoffs</li>
					<li class="list-group-item">
						<strong>Start Time:</strong>
						{new Date(Date.now() + 60 * 60 * 1000).toLocaleString()}
					</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Alliance Selection Alert</h5>
				<p class="card-text">Alliance selection has begun.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Event:</strong> Great Lakes Bay Regional</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Schedule Updated Alert</h5>
				<p class="card-text">The match schedule has been updated.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Event:</strong> Windy City Regional</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Broadcast Alert</h5>
				<p class="card-text">A new broadcast has been announced.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Event Key:</strong> 2024mike2</li>
					<li class="list-group-item">
						<strong>Description:</strong> Field cam is live for playoffs.
					</li>
					<li class="list-group-item">
						<strong>Url:</strong>
						<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer"
							>https://www.youtube.com/watch?v=dQw4w9WgXcQ</a
						>
					</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Match Video Alert</h5>
				<p class="card-text">A new match video has been uploaded.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item"><strong>Match:</strong> qf2</li>
					<li class="list-group-item">
						<strong>Video:</strong>
						<a href="https://www.youtube.com/watch?v=9bZkp7q19f0" target="_blank" rel="noreferrer"
							>YouTube Video</a
						>
					</li>
					<li class="list-group-item">
						<strong>Video:</strong>
						<a href="https://www.twitch.tv/videos/123456789" target="_blank" rel="noreferrer"
							>Twitch Video</a
						>
					</li>
				</ul>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-4">
			<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
				<h5 class="card-title">Unknown Alert Type</h5>
				<p class="card-text">The alert type is not recognized.</p>
				<ul class="list-group list-group-flush">
					<li class="list-group-item">
						<strong>Data:</strong>
						{JSON.stringify({ type: 'mystery', payload: { code: 42 } })}
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
