<script lang="ts">
	import { Potato } from '$lib/model/potato';
	import { Account } from '$lib/model/account';
	import { onMount } from 'svelte';
	import Modal from '../bootstrap/Modal.svelte';
	import { alert, prompt } from '$lib/utils/prompts';
	import Stats from './Stats.svelte';

	const self = Account.getSelf();

	let potato: Potato.FriendData | undefined = $state(Potato.Friend.Generator({}));
	let name = $state('');
	let level = $state(0);
	let phase = $state('');

	onMount(() => {
		let unsub = () => {};
		const u = self.subscribe(async () => {
			const [p] = (
				await Potato.Friend.fromProperty('account', String(self.get().data.id), true).await()
			).unwrap();
			if (!p) return;
			potato = p;
			unsub = p.subscribe((data) => {
				phase = data.icon ? data.icon : Potato.getPhase(data.level || 0);
				level = data.level || 0;
				name = data.name || '';

				let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;

				if (!link) {
					link = document.createElement('link');
					link.rel = 'icon';
					document.head.appendChild(link);
				}

				link.href = `/potato/${phase}.png`;
			});
		});

		return () => {
			unsub();
			u();
		};
	});

	let modal: Modal;
</script>

{#if level && __APP_ENV__.do_potato}
	<div class="d-flex align-items-center">
		<p class="mb-0">
			{level.toLocaleString()}
		</p>
		<button class="btn" onclick={() => modal.show()}>
			<img src="/potato/{phase}.png" alt="" srcset="" style="width: 24px; height: 24px;" />
		</button>
	</div>
{/if}

<Modal title={name} size="md" bind:this={modal}>
	{#snippet body()}
		{#if potato}
			<div class="container-fluid">
				<div class="mb-3">
					<div class="col">
						<p>
							Your potato's level is <span class="text-primary">{$potato.level || NaN}</span> and
							phase is <span class="text-primary">{phase}</span>
						</p>
					</div>
				</div>
				<hr />
				<div class="mb-3">
					<div class="col">
						<p class="text-muted">If your potato is over level 987, you are able to rename it!</p>
						<button
							type="button"
							class="btn btn-primary"
							onclick={async (event) => {
								if (Number($potato.level) < 987) {
									const target = event.currentTarget as HTMLElement;
									target.classList.add('animate__animated', 'animate__shakeX');
									const onend = () => {
										target.classList.remove('animate__animated', 'animate__shakeX');
										target.removeEventListener('animationend', onend);
									};
									target.addEventListener('animationend', onend);
									return;
								}
								modal.hide();
								const name = await prompt('Enter a new name for your potato');
								if (!name) return;
								const res = await Potato.renameYourPotato(name);
								if (res.isOk()) {
									if (!res.value.success) {
										alert(`Your potato could not be renamed: ${res.value.message}`);
									}
								} else {
									console.error(res.error);
								}
							}}
						>
							Name your potato
							{#if Number($potato.level) < 987}
								<strong class="text-secondary">Requires level 987</strong>
							{/if}
						</button>
					</div>
				</div>
				<hr />
				<div class="mb-3">
					<div class="col">
						<p>
							Unlock special icons for your potato by ascending!
							<br />
							<small> After level 987, you can change your potato's icon at any time. </small>
						</p>
						<div class="grid">
							{#each Object.entries(Potato.Levels) as [icon, level]}
								{#if Number($potato.level) >= level}
									<button
										type="button"
										class="btn choose-potato-icon"
										onclick={async () => {
											const res = await Potato.chooseYourIcon(icon);
											if (res.isOk()) {
												if (!res.value.success) {
													alert(`Your potato's icon could not be changed: ${res.value.message}`);
												}
											} else {
												console.error(res.error);
											}
										}}
									>
										<img
											src="/potato/{icon}.png"
											alt=""
											srcset=""
											style="width: 24px; height: 24px;"
										/>
									</button>
								{:else}
									<button type="button" class="btn choose-potato-icon" disabled>
										<i class="material-icons"> lock </i>
										<small class="text-secondary">{level.toLocaleString()}</small>
									</button>
								{/if}
							{/each}
						</div>
					</div>
				</div>
				<hr />
				<div class="mb-3">
					<div class="col">
						{#key potato}
							<Stats {potato} />
						{/key}
					</div>
				</div>
			</div>
		{:else}
			You don't have a potato yet.
		{/if}
	{/snippet}

	{#snippet buttons()}{/snippet}
</Modal>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
		grid-gap: 8px;
	}
	.choose-potato-icon {
		width: 56px;
		height: 56px;
	}
</style>
