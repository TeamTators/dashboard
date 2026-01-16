<script lang="ts">
	import { onMount } from 'svelte';
	import { FIRST } from '$lib/model/FIRST';
	import FileUploader from '../forms/FileUploader.svelte';
	import { Account } from '$lib/model/account';
	import { TBATeam, TBAEvent } from '$lib/utils/tba';
	import Webcam from '@uppy/webcam';
	import '@uppy/webcam/css/style.min.css';
	import ImageEditor from '@uppy/image-editor';
	import Compressor from '@uppy/compressor';
	interface Props {
		team: TBATeam;
		event: TBAEvent;
		teamPictures: FIRST.TeamPicturesArr;
	}

	let pictures: string[] = $state([]);
	// $inspect(pictures);

	const { team, event, teamPictures }: Props = $props();
	let uploadComponent: FileUploader;

	onMount(() => {
		const uppy = uploadComponent.getUppy();
		uppy.use(Webcam, { modes: ['picture'] });
		uppy.use(ImageEditor);
		uppy.use(Compressor, { quality: 0.4 });
		const d = new Date();
		d.setDate(d.getDate() + 7);
		team.getMedia(true, d).then((m) => {
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

		uploadComponent.on('load', (file) => {
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

<div class="container-fluid">
	<div class="row mb-3">
		<div class="col-12 col-md-4 d-flex justify-content-center w-100">
			<FileUploader
				multiple={true}
				message="Upload Pictures"
				usage="images"
				endpoint={`/upload`}
				bind:this={uploadComponent}
			/>
		</div>
	</div>
	<div class="row mb-3">
		{#if pictures.length > 0}
			<div id="carousel-{team.tba.team_number}" class="carousel slide">
				<div class="carousel-inner">
					{#each pictures as picture, i}
						<div class="carousel-item {i === 0 ? 'active' : ''}">
							<img
								src={picture}
								class="d-block w-100"
								alt="Team {team.tba.team_number}"
								style="max-height: 200px; object-fit: contain;"
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
			<div class="d-flex justify-content-center align-items-center text-muted">
				No photos uploaded
			</div>
		{/if}
	</div>
</div>
