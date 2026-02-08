/**
 * @fileoverview Admin navigation section registration.
 *
 * @description
 * Adds the Admin section and its links to the global navbar.
 */
import { Navbar } from '$lib/model/navbar';

/**
 * Register the Admin navigation section.
 *
 * @returns {void} No return value.
 *
 * @example
 * ```ts
 * import registerAdminNav from '$lib/nav/admin';
 * registerAdminNav();
 * ```
 */
export default () => {
	Navbar.addSection({
		name: 'Admin',
		links: [
			{
				name: 'Logs',
				href: '/dashboard/admin/logs',
				icon: {
					type: 'material-icons',
					name: 'format_list_numbered'
				}
			},
			{
				name: 'Data',
				href: '/dashboard/admin/data',
				icon: {
					type: 'material-icons',
					name: 'account_tree'
				}
			},
			{
				name: 'Analytics',
				href: '/dashboard/admin/analytics',
				icon: {
					type: 'material-icons',
					name: 'analytics'
				}
			},
			{
				name: 'Accounts',
				href: '/dashboard/admin/account',
				icon: {
					type: 'material-icons',
					name: 'manage_accounts'
				}
			},
			{
				name: 'Roles',
				href: '/dashboard/admin/role',
				icon: {
					type: 'material-icons',
					name: 'security'
				}
			}
		],
		priority: 0
	});
};
