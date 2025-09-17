export type Email = {
    'forgot-password': {
        link: string;
        supportEmail: string;
    };
'new-user': {
        username: string;
        verification: string;
    };
'tba-subscription': {
        triggerName: string;
        triggerDescription: string;
        details: string;
        manageSubscription: string;
    };
'test': {
        service: string;
        link: string;
        linkText: string;
    };

};