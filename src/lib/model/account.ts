import { attemptAsync } from 'ts-utils/check';
import { sse } from '$lib/utils/sse';
import {
	Struct,
	type PartialStructable,
	type Structable,
	type GlobalCols,
	StructData,
	SingleWritable,
	DataArr
} from 'drizzle-struct/front-end';
import { Requests } from '$lib/utils/requests';

export namespace Account {
	export const Account = new Struct({
		name: 'account',
		structure: {
			username: 'string',
			key: 'string',
			salt: 'string',
			firstName: 'string',
			lastName: 'string',
			email: 'string',
			picture: 'string',
			verified: 'boolean',
			verification: 'string'
		},
		socket: sse
	});

	export type AccountData = StructData<typeof Account.data.structure>;

	export const AccountNotification = new Struct({
		name: 'account_notification',
		structure: {
			accountId: 'string',
			title: 'string',
			severity: 'string',
			message: 'string',
			icon: 'string',
			link: 'string',
			read: 'boolean'
		},
		socket: sse
	});

	export type AccountNotificationData = StructData<typeof AccountNotification.data.structure>;

	const self = new SingleWritable<typeof Account.data.structure>(
		Account.Generator({
			username: 'Guest',
			key: '',
			salt: '',
			firstName: 'Guest',
			lastName: '',
			email: '',
			picture: '',
			verified: false,
			verification: '',
			id: 'guest',
			updated: '0',
			created: '0',
			archived: false,
			universes: '[]',
			attributes: '[]',
			lifetime: 0
		})
	);

	export const getSelf = (): SingleWritable<typeof Account.data.structure> => {
		attemptAsync(async () => {
			const data = (
				await Requests.get<
					PartialStructable<typeof Account.data.structure> & Structable<GlobalCols>
				>('/account/self', {
					expectStream: false
				})
			).unwrap();

			self.set(Account.Generator(data));
		});

		return self;
	};

	const notifs = new DataArr(AccountNotification, []);

	export const getNotifs = (limit: number, offset: number) => {
		attemptAsync(async () => {
			const data = (
				await Requests.get<
					(PartialStructable<typeof AccountNotification.data.structure> & Structable<GlobalCols>)[]
				>(`/account/notifications/${limit}/${offset}`, {
					expectStream: false
				})
			).unwrap();

			notifs.add(...data.map((n) => AccountNotification.Generator(n)));
		});

		return notifs;
	};
}
