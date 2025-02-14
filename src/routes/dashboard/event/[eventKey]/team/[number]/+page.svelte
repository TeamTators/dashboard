<script lang="ts">
	import Card from '$lib/components/dashboard/Card.svelte';
	import { Dashboard } from '$lib/model/dashboard';
	import DB from '$lib/components/dashboard/Dashboard.svelte';

    const { data } = $props();
    const team = data.team;
    const event = data.event;

	const summary = new Dashboard.Card({
		name: 'Event Summary',
		iconType: 'material-icons',
		icon: 'summarize',
		id: 'card1',
		size: {
			width: 1,
			height: 1,
		}
	});

    const comments = new Dashboard.Card({
        name: 'Comments',
        iconType: 'material-icons',
        icon: 'chat',
        id: 'card2',
        size: {
            width: 1,
            height: 2,
        }
    });

    const pictures = new Dashboard.Card({
        name: 'Pictures',
        iconType: 'material-icons',
        icon: 'image',
        id: 'card3',
        size: {
            width: 2,
            height: 1
        }
    });

    const actionHeatmap = new Dashboard.Card({
        name: 'Action Heatmap',
        iconType: 'material-icons',
        icon: 'layers',
        id: 'card4',
        size: {
            width: 1,
            height: 1
        }
    });

    const matches = new Dashboard.Card({
        name: 'Matches',
        iconType: 'material-icons',
        icon: 'sports_esports',
        id: 'card5',
        size: {
            width: 1,
            height: 2
        }
    });

    const pitScouting = new Dashboard.Card({
        name: 'Pit Scouting',
        iconType: 'material-icons',
        icon: 'question_answer',
        id: 'card6',
        size: {
            width: 1,
            height: 2
        }
    });

    const matchViewer = new Dashboard.Card({
        name: 'Match Viewer',
        iconType: 'material-icons',
        icon: 'preview',
        id: 'card7',
        size: {
            width: 1,
            height: 1
        }
    });

    const dashboard = new Dashboard.Dashboard({
        name: `Robot Display: ${team.team_number} - ${team.nickname}`,
        cards: [summary, pictures, comments, actionHeatmap, matches, pitScouting, matchViewer],
        id: 'robot-display',
    });
</script>

<DB {dashboard}>
	{#snippet body()}
		<Card card={summary}>
			{#snippet body()}
				<p>This will be the team summary card</p>
			{/snippet}
		</Card>
        <Card card={pictures}>
            {#snippet body()}
                <p>This will be the pictures card</p>
            {/snippet}
        </Card>
        <Card card={comments}>
            {#snippet body()}
                <p>This will be the comments card</p>
            {/snippet}
        </Card>
        <Card card={actionHeatmap}>
            {#snippet body()}
                <p>This will be the action heatmap card</p>
            {/snippet}
        </Card>
        <Card card={matches}>
            {#snippet body()}
                <p>This will be the matches card</p>
            {/snippet}
        </Card>
        <Card card={pitScouting}>
            {#snippet body()}
                <p>This will be the pit scouting card</p>
            {/snippet}
        </Card>
        <Card card={matchViewer}>
            {#snippet body()}
                <p>This will be the match viewer card</p>
            {/snippet}
        </Card>
	{/snippet}
</DB>
