export type Email = {
	'forgot-password': {
		link: string;
		supportEmail: string;
	};
	'new-user': {
		username: string;
		verification: string;
	};
	'tba-webhook': {
		type: string;
		username: string;
		view_event_url: string;
		manage_subscriptions_url: string;
		timestamp: string;
	};
	test: {
		service: string;
		link: string;
		linkText: string;
	};
	'webhook-init': {
		username: string;
		webhook_type: string;
		subscription_id: string;
		created_date: string;
		webhook_description: string;
		frequency_estimate: string;
		email_address: string;
		manage_subscriptions_url: string;
		test_notification_url: string;
		unsubscribe_url: string;
		timestamp: string;
	};
	'webhook-unsub': {
		username: string;
		webhook_type: string;
		unsubscribe_date: string;
		created_date: string;
		resubscribe_url: string;
		manage_subscriptions_url: string;
		timestamp: string;
	};
};
