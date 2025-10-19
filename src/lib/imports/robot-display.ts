import { browser } from '$app/environment';
import { Navbar } from '$lib/model/navbar';
import type { TBAEvent } from 'tatorscout/tba';

export default (event: TBAEvent) => {
	Navbar.getSections().set([]);
	Navbar.addSection({
		name: event.name,
		links: [
			{
				name: 'Summary',
				href: '/dashboard/event/' + event.key,
				icon: {
					type: 'material-icons',
					name: 'event'
				}
			}
		],
		priority: 0
	});

	Navbar.addSection({
		name: `Matches`,
		priority: 1,
		links: [
			{
				name: 'Matches',
				href: `/dashboard/event/${event.key}/matches`,
				icon: {
					type: 'material-icons',
					name: 'view_list'
				}
			},
			{
				name: 'Archived Matches',
				href: `/dashboard/event/${event.key}/archived-matches`,
				icon: {
					type: 'material-icons',
					name: 'archive'
				}
			}
		]
	});

	Navbar.addSection({
		name: `Scouting`,
		priority: 1,
		links: [
			{
				name: 'Pit Scouting',
				href: '/dashboard/event/' + event.key + '/pit-scouting',
				icon: {
					type: 'material-icons',
					name: 'question_answer'
				}
			},
			{
				name: 'Edit Pit Scouting',
				href: '/dashboard/event/' + event.key + '/edit-pit-scouting',
				icon: {
					type: 'material-icons',
					name: 'edit'
				}
			}
		]
	});

	Navbar.addSection({
		name: `Utilities`,
		priority: 2,
		links: [
			{
				name: 'Team Compare',
				href: `/dashboard/event/${event.key}/compare`,
				icon: {
					type: 'material-icons',
					name: 'compare'
				}
			},
			{
				name: 'Picklist',
				href: `/dashboard/event/${event.key}/picklist`,
				icon: {
					type: 'material-icons',
					name: 'list'
				}
			},
			// {
			// 	name: 'Strategy',
			// 	href: 'https://docs.google.com/presentation/d/1kwopP8dvpRW90R5VY4jQy9Rx5XiZPmFtyoY_8qw5628/edit?usp=sharing',
			// 	icon: {
			// 		type: 'material-icons',
			// 		name: 'assessment'
			// 	}
			// },
			{
				name: 'Qualifications Strategy',
				href: 'https://padlet.com/tatorscout/bordie-strategy-sheet-xvmkd3uf631sg64s',
				icon: {
					type: 'material-icons',
					name: 'assessment'
				}
			},
			{
				name: 'Playoff Strategy',
				href: 'https://padlet.com/tatorscout/eliminations-bordie-26u9obktpg4da31v',
				icon: {
					type: 'material-icons',
					name: 'insights'
				}
			},
			{
				name: 'Checklist',
				href: `/dashboard/event/${event.key}/checklist`,
				icon: {
					type: 'material-icons',
					name: 'list'
				}
			},
			{
				name: 'Drive Team',
				href: `/dashboard/event/${event.key}/drive-team`,
				icon: {
					type: 'material-icons',
					name: 'people'
				}
			}
		]
	});

	Navbar.addSection({
		name: 'Potato',
		priority: 3,
		links: [
			{
				name: 'Potato Leaderboard',
				href: '/dashboard/potato',
				icon: {
					type: 'material-icons',
					name: 'leaderboard'
				}
			},
			{
				name: 'Potato Logs',
				href: '/dashboard/potato/logs',
				icon: {
					type: 'material-icons',
					name: 'history'
				}
			}
		]
	});
};
