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
			}
		],
		priority: 0
	});
};
