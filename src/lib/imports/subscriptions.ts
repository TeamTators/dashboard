import { Navbar } from '$lib/model/navbar';

export default () => {
    Navbar.addSection({
        name: 'Account',
        links: [
            {
                name: 'Home',
                href: '/',
                icon: {
                    type: 'material-icons',
                    name: 'home',
                }
            },
            {
                name: 'TBA Subscriptions', 
                href: '/account/tba-subscription',
                icon: {
                    type: 'material-icons',
                    name: 'notifications',
                }
            }
        ],
        priority: 0
    });
};
