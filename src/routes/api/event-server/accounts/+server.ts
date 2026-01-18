import { Account } from '$lib/server/structs/account';
import { auth } from '$lib/server/utils/auth-api.js';

export const GET = async (event) => {
	auth(event);
	const accounts = (
		await Account.Account.all({
			type: 'stream'
		}).await()
	).unwrap();

	return new Response(JSON.stringify(accounts.map((a) => ({
		id: a.id,
		username: a.data.username,
		firstName: a.data.firstName,
		lastName: a.data.lastName,
	}))), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
