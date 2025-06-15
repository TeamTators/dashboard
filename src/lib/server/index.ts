import { Struct } from 'drizzle-struct/back-end';
import terminal from '$lib/server/utils/terminal';
import { Universes } from '$lib/server/structs/universe';
import { Permissions } from '$lib/server/structs/permissions';
import { getEntitlementNames } from './utils/entitlements';
import type { Entitlement } from '$lib/types/entitlements';
import backup, { BACKUP_DIR } from '../../../scripts/backup';
import { sleepUntil } from 'ts-utils/sleep';
import { dateTime } from 'ts-utils/clock';
import fs from 'fs';
import path from 'path';
import { Account } from './structs/account';

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

		await Account.Admins.new(
			{
				accountId: res.id
			},
			{
				static: true
			}
		).unwrap();



	backupCycle();
	const exists = (await Universes.Universe.fromId('2122')).unwrap();
	if (!exists) {
		await Universes.Universe.new(
			{
				id: '2122',
				name: 'Team Tators',
				description: 'Team Tators single universe',
				public: false,
				archived: false,
				canUpdate: false,
				lifetime: 0,
				attributes: '[]',
				universe: '2122',
				updated: new Date().toISOString(),
				created: new Date().toISOString()
			},
			{
				overwriteGlobals: true
			}
		);
	}

	await Permissions.Role.fromProperty('name', 'Admin', {
		type: 'single'
	}).then(async (hasAdmin) => {
		const res = await getEntitlementNames();
		if (res.isErr()) return terminal.error(res.error);
		if (hasAdmin.isErr()) return terminal.error(hasAdmin.error);

		if (hasAdmin.value) {
			return hasAdmin.value.update({
				entitlements: JSON.stringify(res.value)
			});
		}

		const admin = (
			await Permissions.Role.new({
				universe: '2122',
				name: 'Admin',
				description: `Team Tators Aministrator`,
				links: '[]',
				entitlements: JSON.stringify(res.value)
			})
		).unwrap();
		(await admin.setUniverse('2122')).unwrap();
		(await admin.setStatic(true)).unwrap();
	});

	await Permissions.Role.fromProperty('name', 'Member', {
		type: 'single'
	}).then(async (hasMember) => {
		if (hasMember.isErr() || hasMember.value) return;

		const member = (
			await Permissions.Role.new({
				universe: '2122',
				name: 'Member',
				description: `Team Tators Member`,
				links: '[]',
				entitlements: '[]'
			})
		).unwrap();
		(await member.setUniverse('2122')).unwrap();
		(await member.setStatic(true)).unwrap();
	});

	const scoutRole = (
		await Permissions.Role.fromProperty('name', 'Scout', {
			type: 'single'
		})
	).unwrap();
	if (!scoutRole) {
		const entitlements: Entitlement[] = [
			'view-checklist',
			'view-pit-scouting',
			'view-potatoes',
			'view-roles',
			'view-scouting',
			'view-strategy',
			'view-tba-info',
			'view-universe',
			'upload-pictures'
		];
		const scout = (
			await Permissions.Role.new(
				{
					universe: '2122',
					name: 'Scout',
					description: 'Team Tators Scout',
					links: '[]',
					entitlements: JSON.stringify(entitlements)
				},
				{
					overwriteGenerators: true
				}
			)
		).unwrap();
		(await scout.setUniverse('2122')).unwrap();
	}

	const mentorRole = (
		await Permissions.Role.fromProperty('name', 'Mentor', {
			type: 'single'
		})
	).unwrap();
	if (!mentorRole) {
		const entitlements: Entitlement[] = [
			'manage-pit-scouting',
			'manage-roles',
			'manage-tba',
			'create-custom-tba-responses'
		];
		const mentor = (
			await Permissions.Role.new(
				{
					universe: '2122',
					name: 'Mentor',
					description: 'Team Tators Mentor',
					links: '[]',
					entitlements: JSON.stringify(entitlements)
				},
				{
					overwriteGenerators: true
				}
			)
		).unwrap();
		(await mentor.setUniverse('2122')).unwrap();
	}

	const potatoAdminRole = (
		await Permissions.Role.fromProperty('name', 'Potato Admin', {
			type: 'single'
		})
	).unwrap();
	if (!potatoAdminRole) {
		const entitlements: Entitlement[] = ['edit-potato-level', 'view-potatoes'];
		const mentor = (
			await Permissions.Role.new(
				{
					universe: '2122',
					name: 'Potato Admin',
					description: 'Team Tators Potato Admin',
					links: '[]',
					entitlements: JSON.stringify(entitlements)
				},
				{
					overwriteGenerators: true
				}
			)
		).unwrap();
		(await mentor.setUniverse('2122')).unwrap();
	}
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
