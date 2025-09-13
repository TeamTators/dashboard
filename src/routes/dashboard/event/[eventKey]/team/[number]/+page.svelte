<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import Card from '$lib/components/dashboard/Card.svelte';
	import { Dashboard } from '$lib/model/dashboard';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import { sleep } from 'ts-utils/sleep';
	import { afterNavigate } from '$app/navigation';
	import PictureDisplay from '$lib/components/robot-display/PictureDisplay.svelte';
	import PitScoutingCard from '$lib/components/robot-display/pit-scouting/PitScoutingCard.svelte';
	import TeamComments from '$lib/components/robot-display/TeamComments.svelte';
	import EventSummary from '$lib/components/robot-display/EventSummary.svelte';
	import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
	import MatchTable from '$lib/components/robot-display/MatchTable.svelte';
	import Progress from '$lib/components/charts/Progress.svelte';
	import TeamEventStats from '$lib/components/charts/TeamEventStats.svelte';
	import AverageContributions from '$lib/components/robot-display/AverageContributions.svelte';
	import AverageContributionsPie from '$lib/components/charts/AverageContributionsPie.svelte';
	import type { DataArr, Blank, StructData } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { listen } from '$lib/utils/struct-listener';
	import ScoutSummary from '$lib/components/robot-display/ScoutSummary.svelte';
	import ChecksSummary from '$lib/components/robot-display/ChecksSummary.svelte';

	const { data } = $props();
	const event = $derived(new TBAEvent(data.event));
	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));
	const team = $derived(new TBATeam(data.team, event));
	const scouting = $derived(data.scouting);
	const comments = $derived(data.comments);
	const answers = $derived(data.answers);
	const questions = $derived(data.questions);
	const groups = $derived(data.groups);
	const sections = $derived(data.sections);
	const pictures = $derived(data.pictures);
	const answerAccounts = $derived(data.answerAccounts);
	const matches = $derived(data.matches.map((m) => new TBAMatch(m, event)));
	const scoutingAccounts = $derived(data.scoutingAccounts);
	const checksSum = $derived(data.checksSum);
	$effect(() => nav(event.tba));

	const summary = new Dashboard.Card({
		name: 'Event Summary',
		icon: {
			type: 'material-icons',
			name: 'summarize'
		},
		id: 'event_summary',
		size: {
			width: 2,
			height: 1,
			lg: {
				width: 4,
				height: 1
			},
			md: {
				width: 4,
				height: 1
			},
			sm: {
				width: 5,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const picturesCard = new Dashboard.Card({
		name: 'Pictures',
		icon: {
			type: 'material-icons',
			name: 'image'
		},
		id: 'pictures',
		size: {
			width: 4,
			height: 1,
			lg: {
				width: 8,
				height: 1
			},
			md: {
				width: 8,
				height: 1
			},
			sm: {
				width: 7,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const commentsCard = new Dashboard.Card({
		name: 'Comments',
		icon: {
			type: 'material-icons',
			name: 'chat'
		},
		id: 'comments',
		size: {
			width: 4,
			height: 1,
			lg: {
				width: 8,
				height: 1
			},
			md: {
				width: 8,
				height: 1
			},
			sm: {
				width: 12,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const pitScouting = new Dashboard.Card({
		name: 'Pit Scouting',
		icon: {
			type: 'material-icons',
			name: 'question_answer'
		},
		id: 'pit_scouting',
		size: {
			width: 2,
			height: 1,
			lg: {
				width: 4,
				height: 1
			},
			md: {
				width: 4,
				height: 1
			},
			sm: {
				width: 4,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const matchViewer = new Dashboard.Card({
		name: 'Matches',
		icon: {
			type: 'material-icons',
			name: 'preview'
		},
		id: 'matches',
		size: {
			width: 4,
			height: 1,
			xl: {
				width: 6,
				height: 1
			},
			lg: {
				width: 6,
				height: 1
			},
			md: {
				width: 12,
				height: 1
			},
			sm: {
				width: 8,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const progress = new Dashboard.Card({
		name: 'Progress',
		icon: {
			type: 'material-icons',
			name: 'trending_up'
		},
		id: 'progress',
		size: {
			width: 4,
			height: 1,
			xl: {
				width: 6,
				height: 1
			},
			lg: {
				width: 6,
				height: 1
			},
			md: {
				width: 12,
				height: 1
			},
			sm: {
				width: 6,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const eventStats = new Dashboard.Card({
		name: 'Event Stats',
		icon: {
			type: 'material-icons',
			name: 'trending_up'
		},
		id: 'event_stats',
		size: {
			width: 4,
			height: 1,
			xl: {
				width: 6,
				height: 1
			},
			lg: {
				width: 6,
				height: 1
			},
			md: {
				width: 12,
				height: 1
			},
			sm: {
				width: 6,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const averageContributionsTable = new Dashboard.Card({
		name: 'Average Contribution',
		icon: {
			type: 'material-icons',
			name: 'all_inclusive'
		},
		id: 'average_contributions_table',
		size: {
			width: 2,
			height: 1,
			xl: {
				width: 3,
				height: 1
			},
			lg: {
				width: 3,
				height: 1
			},
			md: {
				width: 6,
				height: 1
			},
			sm: {
				width: 4,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const averageContributionsPie = new Dashboard.Card({
		name: 'Average Contribution',
		icon: {
			type: 'material-icons',
			name: 'all_inclusive'
		},
		id: 'average_contributions_pie',
		size: {
			width: 2,
			height: 1,
			xl: {
				width: 3,
				height: 1
			},
			lg: {
				width: 3,
				height: 1
			},
			md: {
				width: 6,
				height: 1
			},
			sm: {
				width: 4,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const scoutSummary = new Dashboard.Card({
		name: 'Scout Summary',
		icon: {
			type: 'material-icons',
			name: 'summarize'
		},
		id: 'scout_summary',
		size: {
			width: 2,
			height: 1,
			lg: {
				width: 4,
				height: 1
			},
			md: {
				width: 4,
				height: 1
			},
			sm: {
				width: 4,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	const checksSummary = new Dashboard.Card({
		name: 'Checks Summary',
		icon: {
			type: 'material-icons',
			name: 'summarize'
		},
		id: 'checks_summary',
		size: {
			width: 4,
			height: 1,
			lg: {
				width: 6,
				height: 1
			},
			md: {
				width: 6,
				height: 1
			},
			sm: {
				width: 6,
				height: 1
			},
			xs: {
				width: 12,
				height: 1
			}
		}
	});

	// const actionHeatmap = new Dashboard.Card({
	// 	name: 'Action Heatmap',
	// 	iconType: 'material-icons',
	// 	icon: 'layers',
	// 	id: 'heatmap',
	// 	size: {
	// 		width: 1,
	// 		height: 1,
	// 	}
	// });
	let dashboard = $state(
		new Dashboard.Dashboard({
			name: `Robot Display: ${data.team.team_number} - ${data.team.nickname}`,
			cards: [
				summary,
				picturesCard,
				commentsCard,
				// actionHeatmap,
				pitScouting,
				matchViewer,
				progress,
				eventStats,
				scoutSummary,
				checksSummary
			],
			id: 'robot-display'
		})
	);

	$effect(() => {
		dashboard = new Dashboard.Dashboard({
			name: `Robot Display: ${team.tba.team_number} - ${team.tba.nickname}`,
			cards: [
				summary,
				picturesCard,
				commentsCard,
				// actionHeatmap,
				pitScouting,
				matchViewer,
				progress,
				eventStats,
				checksSummary
			],
			id: 'robot-display'
		});
	});

	let scroller: HTMLDivElement;

	afterNavigate(() => {
		const btn = scroller.querySelector(`[data-team="${team.tba.team_number}"]`);
		if (btn) {
			sleep(500).then(() =>
				btn.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'center'
				})
			);
		}
	});

	onMount(() => {
		const offScouting = listen(
			scouting,
			(d) => d.data.eventKey === event.tba.key && d.data.team === team.tba.team_number
		);
		const offComments = listen(
			comments,
			(d) => d.data.team === team.tba.team_number && d.data.eventKey === event.tba.key
		);
		const offAnswers = listen(
			answers,
			(d) =>
				d.data.team === team.tba.team_number &&
				!!questions.data.find((q) => q.data.id === d.data.questionId)
		);
		const offQuestions = listen(
			questions,
			(d) => !!groups.data.find((s) => s.data.id === d.data.groupId)
		);
		const offGroups = listen(
			groups,
			(d) => !!sections.data.find((s) => s.data.id === d.data.sectionId)
		);
		const offSections = listen(sections, (d) => d.data.eventKey === event.tba.key);
		const offPictures = listen(
			pictures,
			(d) => d.data.eventKey === event.tba.key && d.data.team == team.tba.team_number
		);
		return () => {
			offScouting();
			offComments();
			offAnswers();
			offQuestions();
			offGroups();
			offSections();
			offPictures();
		};
	});
</script>

<DB {dashboard}>
	{#snippet body()}
		<div style="grid-column: span var(--grid-size);">
			<div class="ws-nowrap scroll-x p-3 mb-3" bind:this={scroller}>
				{#each teams as t}
					<a
						type="button"
						href="/dashboard/event/{event.tba.key}/team/{t.tba.team_number}"
						class="btn mx-2"
						class:btn-primary={t.tba.team_number !== team.tba.team_number}
						class:btn-outline-secondary={t.tba.team_number === team.tba.team_number}
						class:btn-disabled={t.tba.team_number === team.tba.team_number}
						class:text-muted={t.tba.team_number === team.tba.team_number}
						onclick={(e) => {
							if (t.tba.team_number === team.tba.team_number) {
								return e.preventDefault();
							}
						}}
						data-team={t.tba.team_number}
					>
						{t.tba.team_number}
					</a>
				{/each}
			</div>
			<div class="d-flex">
				<a
					href="https://docs.google.com/spreadsheets/d/1ntbCYyqMxMLbD6R0rVxfx_sIgq0mrYtXbbh2Wb5iuok/edit?gid=722231706#gid=722231706"
					type="button"
					target="_blank"
					class="btn btn-primary"
				>
					Picklist Spreadsheet
				</a>
				<a
					href="/year/{event.tba.year}/prescouting/team/{team.tba.team_number}"
					type="button"
					class="btn btn-primary ms-2">View Prescouting</a
				>
			</div>

			<!-- <div class="btn-group" role="group" aria-label="Basic checkbox toggle button group">
				<input
					type="checkbox"
					class="btn-check"
					id="btncheck1"
					autocomplete="off"
					bind:checked={focus.auto}
				/>
				<label class="btn btn-outline-secondary" for="btncheck1">Auto</label>

				<input
					type="checkbox"
					class="btn-check"
					id="btncheck2"
					autocomplete="off"
					bind:checked={focus.teleop}
				/>
				<label class="btn btn-outline-secondary" for="btncheck2">Teleop</label>

				<input
					type="checkbox"
					class="btn-check"
					id="btncheck3"
					autocomplete="off"
					bind:checked={focus.endgame}
				/>
				<label class="btn btn-outline-secondary" for="btncheck3">Endgame</label>
			</div> -->
		</div>

		{#key team}
			<Card card={summary}>
				{#snippet body()}
					<EventSummary {matches} {team} {event} {scouting} />
				{/snippet}
			</Card>
			<Card card={picturesCard}>
				{#snippet body()}
					<PictureDisplay {team} {event} teamPictures={pictures} />
				{/snippet}
			</Card>
			<Card card={commentsCard}>
				{#snippet body()}
					<TeamComments team={team.tba.team_number} event={event.tba.key} {comments} {scouting} />
				{/snippet}
			</Card>
			<!-- <Card card={actionHeatmap}>
				{#snippet body()}
					<p>This will be the action heatmap card</p>
				{/snippet}
			</Card> -->
			<Card card={pitScouting}>
				{#snippet body()}
					<PitScoutingCard
						{team}
						{event}
						{sections}
						{groups}
						{questions}
						{answers}
						{answerAccounts}
					/>
				{/snippet}
			</Card>
			<Card card={matchViewer}>
				{#snippet body()}
					<MatchTable {team} {event} {scouting} />
				{/snippet}
			</Card>
			<Card card={progress}>
				{#snippet body()}
					<Progress {team} {event} {scouting} {matches} defaultView={'points'} />
				{/snippet}
			</Card>
			<Card card={eventStats}>
				{#snippet body()}
					<TeamEventStats {team} {event} {scouting} {matches} />
				{/snippet}
			</Card>
			<Card card={averageContributionsTable}>
				{#snippet body()}
					<AverageContributions {team} {event} {scouting} {matches} />
				{/snippet}
			</Card>
			<Card card={averageContributionsPie}>
				{#snippet body()}
					<AverageContributionsPie {team} {event} {scouting} {matches} />
				{/snippet}
			</Card>
			<Card card={scoutSummary}>
				{#snippet body()}
					<ScoutSummary scouts={scoutingAccounts} />
				{/snippet}
			</Card>
			<Card card={checksSummary}>
				{#snippet body()}
					<ChecksSummary checks={checksSum} />
				{/snippet}
			</Card>
		{/key}
	{/snippet}
</DB>

<style>
	.btn-disabled {
		pointer-events: none;
	}
</style>
