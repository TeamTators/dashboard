<script lang="ts">
	import { onMount } from 'svelte';
	import { FIRST } from '$lib/model/FIRST';
	import FileUploaderComponent from '../forms/FileUploader.svelte';
	import { Account } from '$lib/model/account';
	import { TBATeam, TBAEvent } from '$lib/utils/tba';
	import Webcam from '@uppy/webcam';
	import ImageEditor from '@uppy/image-editor';
	import Compressor from '@uppy/compressor';
	import type { BasePlugin, Body, Meta, PluginOpts, Uppy } from '@uppy/core';
	interface Props {
		team: TBATeam;
		event: TBAEvent;
		teamPictures: FIRST.TeamPicturesArr;
	}

	let pictures: string[] = $state([]);
	// $inspect(pictures);

	const { team, event, teamPictures }: Props = $props();
	let uploadComponent: FileUploaderComponent;

	type PluginArr = {
		Plugin: new (
			uppy: Uppy<Meta, Record<string, never>>,
			opts?: PluginOpts
		) => BasePlugin<any, Meta, Record<string, never>, Record<string, unknown>>;
		PluginOpts: Record<string, unknown>;
	}[];

	const plugins: PluginArr = [
		{ Plugin: Webcam, PluginOpts: { modes: ['picture'] } },
		{ Plugin: ImageEditor, PluginOpts: { quality: 0.9, cropperOptions: { viewMode: 1 } } },
		{ Plugin: Compressor, PluginOpts: { quality: 0.8 } }
	];

	onMount(() => {
		team.getMedia().then((m) => {
			if (m.isErr()) return console.error(m.error);
			pictures.push(
				...m.value.filter((media) => media.type === 'imgur').map((media) => media.direct_url)
			);
		});

		const unsub = teamPictures.subscribe((p) => {
			pictures.push(
				...new Set(p.map((tp) => `/assets/uploads/${tp.data.picture}`).filter(Boolean))
			);
		});

		const off = uploadComponent.on('load', (file) => {
			FIRST.TeamPictures.new({
				team: team.tba.team_number,
				eventKey: event.tba.key,
				picture: file,
				accountId: Account.getSelf().get().data.id || ''
			});
		});

		return () => {
			unsub();
		};
	});
</script>

<div class="container-fluid h-100">
	<div class="d-flex flex-column flex-md-row h-auto h-md-100">
		<div class="col-12 col-md-4 order-1 order-md-2 p-2 h-auto h-md-75">
			<FileUploaderComponent
				multiple={true}
				message="Upload Pictures"
				usage="images"
				{plugins}
				endpoint={`/upload`}
				bind:this={uploadComponent}
			/>
		</div>

		<div class="col-12 col-md-8 order-2 order-md-1 p-2 h-auto h-md-100">
			{#if pictures.length > 0}
				<div id="carousel-{team.tba.team_number}" class="carousel slide h-100">
					<div class="carousel-inner h-100">
						{#each pictures as picture, i}
							<div class="carousel-item {i === 0 ? 'active' : ''} h-100">
								<img
									src={picture}
									alt="Team {team.tba.team_number}"
									class="d-block w-100 h-100"
									style="object-fit: contain;"
								/>
							</div>
						{/each}
					</div>
					<button
						class="carousel-control-prev"
						type="button"
						data-bs-target="#carousel-{team.tba.team_number}"
						data-bs-slide="prev"
					>
						<span class="carousel-control-prev-icon" aria-hidden="true"></span>
						<span class="visually-hidden">Previous</span>
					</button>
					<button
						class="carousel-control-next"
						type="button"
						data-bs-target="#carousel-{team.tba.team_number}"
						data-bs-slide="next"
					>
						<span class="carousel-control-next-icon" aria-hidden="true"></span>
						<span class="visually-hidden">Next</span>
					</button>
				</div>
			{:else}
				<div class="d-flex justify-content-center align-items-center h-100 text-muted">
					No photos uploaded
				</div>
			{/if}
		</div>
	</div>
</div>
