<script lang="ts">
	import { onMount } from 'svelte';
	import * as TBA from '$lib/utils/tba';
	import { Scouting } from '$lib/model/scouting';
	import { FIRST } from '$lib/model/FIRST';
	import { DataArr } from 'drizzle-struct/front-end';
	import { loadFiles } from '$lib/utils/downloads';
	import FileUploaderComponent from '../forms/FileUploader.svelte';
	import { FileUploader } from '$lib/utils/files';
	import { Account } from '$lib/model/account';
	import { TBATeam, TBAEvent } from '$lib/utils/tba';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
		teamPictures: FIRST.TeamPicturesArr;
	}

	let pictures: string[] = $state([]);
	// $inspect(pictures);

	const { team, event, teamPictures }: Props = $props();

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

		const off = uploadComponent.on('addFile', (file) => {
			FIRST.TeamPictures.new({
				team: team.tba.team_number,
				eventKey: event.tba.key,
				picture: file.id,
				accountId: Account.getSelf().get().data.id || ''
			});
		});

		return () => {
			unsub();
			off();
		};
	});

	const uploader = new FileUploader(
		`/dashboard/event/${event.tba.key}/team/${team.tba.team_number}/picture`,
		{
			method: 'POST'
		}
	);

	let uploadComponent: FileUploaderComponent;
</script>

<div class="container-fluid h-100">
	<div class="row h-100">
		<div class="col-8 h-100">
			<div id="carousel-{team.tba.team_number}" class="carousel slide h-100">
				<div class="carousel-inner h-100">
					{#each pictures as picture, i}
						<div class="carousel-item h-100 {i === 0 ? 'active' : ''}">
							<img
								src={picture}
								alt="..."
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
		</div>
		<div class="col-4">
			<FileUploaderComponent
				bind:this={uploadComponent}
				multiple={true}
				{uploader}
				message="Upload a picture"
			/>
		</div>
	</div>
</div>
