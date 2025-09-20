import { Account } from '$lib/model/account.js';

export const load = (event) => {
	return {
		account: Account.Account.Generator(event.data.account)
	};
};
