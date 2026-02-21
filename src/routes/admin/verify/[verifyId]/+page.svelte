<script lang="ts">
	const { data } = $props();
	const { account } = $derived(data);
</script>

<div class="container d-flex flex-column align-items-center justify-content-center vh-100">
	<div class="card shadow-sm p-4 text-center" style="max-width: 400px; width: 100%;">
		<h2 class="mb-3">Verify: {$account.username}</h2>
		<p class="text-muted">
			A new user has requested to join Team Tators. Click the button below to verify.
		</p>

		<a href="?/verify" type="button" class="btn btn-primary">
			Verify {$account.username}
		</a>

		<a href="/" class="btn btn-primary mt-3">Back to home</a>
	</div>
</div>
