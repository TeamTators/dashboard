import { Navbar } from "$lib/model/navbar";

Navbar.addSection({
    name: 'Mentor',
    links: [
        {
            icon: 'home',
            href: '/',
            name: 'Home',
            type:'material-icons',
        },
        {
            icon: 'person',
            href: '/dashboard/mentor/accounts',
            name: 'Accounts',
            type: 'material-icons',
        },
        {
            icon: 'question_answer',
            href: `/dashboard/mentor/pitscouting/year/${new Date().getFullYear()}`,
            name: 'Edit Pit Scouting',
            type: 'material-icons',
        }
    ],
    priority: 1,
});