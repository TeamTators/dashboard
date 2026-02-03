import { Navbar } from '$lib/model/navbar';

export default () => {
	Navbar.addSection({
		name: 'Mentor',
		links: [
			{
				name: 'Accounts',
				href: '/dashboard/mentor/accounts',
				icon: {
					type: 'material-icons',
					name: 'contacts'
				}
			},
			{
				name: 'Custom TBA',
				href: '/dashboard/mentor/custom-tba',
				icon: {
					type: 'material-icons',
					name: 'auto_awesome_mosaic'
				}
			},
			{
				name: 'Potato Leaderboard',
				href: '/dashboard/mentor/potato',
				icon: {
					type: 'material-icons',
					name: 'leaderboard'
				}
			},
			{
				name: 'Potato Logs',
				href: '/dashboard/mentor/potato/logs',
				icon: {
					type: 'material-icons',
					name: 'history'
				}
			}
		],
		priority: 0
	});
};
