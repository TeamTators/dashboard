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
				icon: 'event',
				type: 'material-icons'
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
				icon: 'view_list',
				type: 'material-icons'
			},
			{
				name: 'Archived Matches',
				href: `/dashboard/event/${event.key}/archived-matches`,
				icon: 'archive',
				type: 'material-icons'
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
				icon: 'question_answer',
				type: 'material-icons'
			},
			{
				name: 'Edit Pit Scouting',
				href: '/dashboard/event/' + event.key + '/edit-pit-scouting',
				icon: 'edit',
				type: 'material-icons'
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
				icon: 'compare',
				type: 'material-icons'
			},
			{
				name: 'Strategy',
				href: 'https://docs.google.com/presentation/d/1kwopP8dvpRW90R5VY4jQy9Rx5XiZPmFtyoY_8qw5628/edit?usp=sharing',
				icon: 'assessment',
				type: 'material-icons'
			},
			{
				name: 'Checklist',
				href: `/dashboard/event/${event.key}/checklist`,
				icon: 'list',
				type: 'material-icons'
			},
			{
				name: 'Drive Team',
				href: `/dashboard/event/${event.key}/drive-team`,
				icon: 'people',
				type: 'material-icons'
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
				icon: 'leaderboard',
				type: 'material-icons'
			},
			{
				name: 'Potato Logs',
				href: '/dashboard/potato/logs',
				icon: 'history',
				type: 'material-icons'
			}
		]
	});
};
