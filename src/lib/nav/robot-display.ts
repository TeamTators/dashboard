/**
 * @fileoverview Robot-display navigation for a specific event.
 *
 * @description
 * Clears existing navbar sections and registers event-specific sections and utilities.
 */
import { Navbar } from '$lib/model/navbar';
import type { TBAEvent } from 'tatorscout/tba';

/**
 * Register robot-display navigation sections for the given event.
 *
 * @param event - TBA event used for link generation.
 * @returns {void} No return value.
 *
 * @example
 * ```ts
 * import registerRobotDisplayNav from '$lib/nav/robot-display';
 * registerRobotDisplayNav(event);
 * ```
 */
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
			},
			{
				name: 'Upload Match Data',
				href: `/dashboard/event/${event.key}/upload-match`,
				icon: {
					type: 'material-icons',
					name: 'upload_file'
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
			// {
			// 	name: 'Strategy',
			// 	href: 'https://docs.google.com/presentation/d/1kwopP8dvpRW90R5VY4jQy9Rx5XiZPmFtyoY_8qw5628/edit?usp=sharing',
			// 	icon: {
			// 		type: 'material-icons',
			// 		name: 'assessment'
			// 	}
			// },
			{
				name: 'Score Calculator',
				href: 'https://frc.ohlinis.me/',
				icon: {
					type: 'material-icons',
					name: 'calculate'
				},
				external: true
			},
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
			},
			{
				name: 'Subscriptions',
				href: `/dashboard/event/${event.key}/subscriptions`,
				icon: {
					type: 'material-icons',
					name: 'notifications',
				},
			},
			{
				name: 'Simulator',
				href: `/year/${event.year}/simulator`,
				icon: {
					type: 'material-icons',
					name: 'sports_motorsports'
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
