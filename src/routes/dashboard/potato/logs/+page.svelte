<script lang="ts">
	import { dateTime } from 'ts-utils/clock';
	import { Navbar } from '$lib/model/navbar';

	Navbar.getSections().set([]);

	Navbar.addSection({
		name: 'Potato',
		links: [
			{
				name: 'Home',
				href: '/',
				icon: 'home',
				type: 'material-icons'
			},
			{
				name: 'Leaderboard',
				href: '/dashboard/potato',
				icon: 'leaderboard',
				type: 'material-icons'
			}
		],
		priority: 0
	});

	const { data } = $props();
	const logs = $derived(data.logs);
	const limit = $derived(data.limit);
	const page = $derived(data.page);
	const count = $derived(data.count);

	const next = () => {
		if (page === Math.ceil(count / limit)) return;
		const params = new URLSearchParams(location.search);
		params.set('page', (page + 1).toString());
		params.set('limit', limit.toString());
		location.search = params.toString();
		location.reload();
	};

	const prev = () => {
		if (page === 1) return;
		const params = new URLSearchParams(location.search);
		params.set('page', (page - 1).toString());
		params.set('limit', limit.toString());
		location.search = params.toString();
	};

	const setLimit = (limit: number) => {
		const params = new URLSearchParams(location.search);
		params.set('page', '1');
		params.set('limit', limit.toString());
		location.search = params.toString();
	};
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<div class="d-flex justify-content-between">
				<h1>Logs</h1>
				<small class="text-muted">
					Showing {logs.length} of {count} logs
				</small>
			</div>
			<button
				type="button"
				class="btn btn-secondary"
				onclick={prev}
				disabled={page === Math.ceil(count / limit)}
			>
				<i class="material-icons">arrow_back</i>
			</button>
			<button type="button" class="btn btn-secondary" onclick={next} disabled={page === 1}>
				<i class="material-icons">arrow_forward</i>
			</button>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<div class="table-responsive">
				<table class="table">
					<tbody>
						{#each logs as log}
							<tr>
								<td>
									{log.potato}
								</td>
								<td>
									{log.reason}
								</td>
								<td>
									{log.amount}
								</td>
								<td>
									{dateTime(new Date(log.created))}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
