import { Navbar } from '$lib/model/navbar';

export default () => {
	Navbar.addSection({
		name: 'Mentor',
		links: [
			{
				name: 'Accounts',
				href: '/dashboard/mentor/accounts',
				icon: 'contacts',
				type: 'material-icons'
			},
			{
				name: 'Custom TBA',
				href: '/dashboard/mentor/custom-tba',
				icon: 'auto_awesome_mosaic',
				type: 'material-icons'
			}
		],
		priority: 0
	});
};
