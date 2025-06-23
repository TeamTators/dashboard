import { Struct } from 'drizzle-struct/back-end';
import terminal from '$lib/server/utils/terminal';
import { Permissions } from '$lib/server/structs/permissions';
import type { Entitlement } from '$lib/types/entitlements';
import backup, { BACKUP_DIR } from '../../../scripts/backup';
import { sleepUntil } from 'ts-utils/sleep';
import { dateTime } from 'ts-utils/clock';
import fs from 'fs';
import path from 'path';
import { Account } from './structs/account';
import { Redis } from '$lib/server/services/redis';
import { TBAWebhooks } from '$lib/server/services/tba-webhooks';

Redis.connect(String(process.env.REDIS_NAME)).then((res) => {
	if (res.isErr()) {
		terminal.error('Failed to connect to Redis', res.error);
	} else {
		terminal.log('Connected to Redis');
	}
});

Redis.once('sub-connect', () => {
	TBAWebhooks.init(String(process.env.LOCAL_TBA_WEBHOOK_REDIS_NAME));
});

const backupCycle = () => {
	if (!process.env.BACKUP_INTERVAL) return;
	const interval = parseInt(process.env.BACKUP_INTERVAL);
	if (isNaN(interval)) return console.error('Invalid BACKUP_INTERVAL');

	const max = parseInt(String(process.env.MAX_BACKUPS));
	if (isNaN(max)) return console.error('Invalid MAX_BACKUPS');

	const wait = (callback: () => void, ms: number) => {
		if (ms > 1000 * 60 * 60 * 24) {
			sleepUntil(callback, new Date(Date.now() + ms));
		} else {
			setTimeout(callback, ms);
		}
	};

	const run = async () => {
		terminal.log('Making backup');
		await backup('automatic')
			.then(() => console.log('Backup complete'))
			.catch((e) => terminal.error('Error during backup', e));
		console.log('Next backup at: ', dateTime(new Date(Date.now() + interval)));

		// sort from oldest to newest
		const backups = fs.readdirSync(BACKUP_DIR).sort((a, b) => {
			const aTime = parseInt(a.split('-')[0]);
			const bTime = parseInt(b.split('-')[0]);
			return aTime - bTime;
		});

		// remove oldest backups
		const toRemove = backups.slice(0, backups.length - max);
		for (const file of toRemove) {
			console.log('Removing backup:', file);
			fs.unlinkSync(path.resolve(BACKUP_DIR, file));
		}

		wait(run, interval);
	};
	run();
};

export const postBuild = async () => {
	const admin = await Account.Account.fromProperty(
		'username',
		process.env.ADMIN_USERNAME || 'admin',
		{ type: 'single' }
	);
	if (admin.isErr()) {
		terminal.error(`Failed to find admin account: ${admin.error}`);
		return;
	}
	if (!admin.value) {
		terminal.log('No admin account found, creating one...');
		const res = await Account.createAccount(
			{
				username: process.env.ADMIN_USERNAME || 'admin',
				email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
				password: process.env.ADMIN_PASSWORD || 'Admin123!',
				firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
				lastName: process.env.ADMIN_LAST_NAME || 'User'
			},
			{
				canUpdate: false
			}
		).unwrap();

		await res
			.update({
				verified: true,
				verification: ''
			})
			.unwrap();

		// As it sits right now, an admin account is created when the user is verified.
		// await Account.Admins.new(
		// 	{
		// 		accountId: res.id
		// 	},
		// 	{
		// 		static: true
		// 	}
		// ).unwrap();
	}

	backupCycle();

	// TODO: create default roles and permissions
};

{
	const built = new Set<string>();
	for (const struct of Struct.structs.values()) {
		struct.once('build', () => {
			built.add(struct.name);
			if (built.size === Struct.structs.size) {
				postBuild();
			}
		});
	}
}
