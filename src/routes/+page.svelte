<script lang="ts">
	import '$lib/index';
</script>

<svelte:head>
	<title>{__APP_ENV__.name}</title>
</svelte:head>

<div class="container mt-5">
	<div class="row">
		<div class="col-md-6 p-3">
			<a href="/year/2025" class="text-reset text-decoration-none">
				<div class="card bg-primary">
					<div class="card-body">
						<h5 class="card-title">2025 Dashboard</h5>
						<p class="card-text">This is the portal to all 2025 scouting information</p>
					</div>
				</div>
			</a>
		</div>
		<div class="col-md-6 p-3">
			<a href="/dashboard/mentor" class="text-reset text-decoration-none">
				<div class="card bg-success">
					<div class="card-body">
						<h5 class="card-title">Mentor Dashboard</h5>
						<p class="card-text">Manage accounts and user access</p>
					</div>
				</div>
			</a>
		</div>
		{#if __APP_ENV__.do_potato}
			<div class="col-md-6 p-3">
				<a href="/dashboard/potato" class="text-reset text-decoration-none">
					<div class="card bg-warning">
						<div class="card-body">
							<h5 class="card-title text-black">Potato Leaderboard</h5>
							<p class="card-text text-black">View the potato leaderboard</p>
						</div>
					</div>
				</a>
			</div>
		{/if}
		<div class="col-md-6 p-3">
			<a href="/dashboard/admin" class="text-reset text-decoration-none">
				<div class="card bg-danger">
					<div class="card-body">
						<h5 class="card-title text-black">Admin</h5>
						<p class="card-text text-black">Admin Page</p>
					</div>
				</div>
			</a>
		</div>
	</div>
</div>
