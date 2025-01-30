import { type Writable, writable } from 'svelte/store';
import { attempt, attemptAsync } from 'ts-utils/check';
// import { Requests } from '../utils/requests';
import { Account } from './account';
import { Struct, StructData } from 'drizzle-struct/front-end';
import { type Blank } from 'drizzle-struct/front-end';
import { decode, encode } from 'ts-utils/text';
import { sse } from '$lib/utils/sse';
import type { DataAction, PropertyAction } from 'drizzle-struct/types';
import { browser } from '$app/environment';


export namespace Permissions {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const getPermissionStructs = (): Struct<any>[] => [
		Role,
		Account.Account,
	];

	export class PermissionError extends Error {
		constructor(message: string) {
			super(message);
			this.name = 'PermissionError';
		}
	}

	export type StructPermission<T extends Blank> = {
		property: keyof T;
		update: boolean;
		read: boolean;
	};

	type Permissions = {
		create: boolean;
		delete: boolean;

		'read-archive': boolean;
		archive: boolean;
		'restore-archive': boolean;

		'read-version-history': boolean;
		'restore-version': boolean;
		'delete-version': boolean;
	};

	export class StructProperty<T extends Blank>
		implements
			Writable<{
				property: keyof T;
				update: boolean;
				read: boolean;
			}>
	{
		public data: {
			property: keyof T;
			update: boolean;
			read: boolean;
		};

		private readonly subscribers: Set<
			(value: { property: keyof T; update: boolean; read: boolean }) => void
		> = new Set();

		constructor(property: keyof T, update: boolean, read: boolean) {
			this.data = {
				property,
				update,
				read
			};
		}

		inform() {
			this.subscribers.forEach((sub) => sub(this.data));
		}

		set(value: { property: keyof T; update: boolean; read: boolean }) {
			this.data = value;
			this.inform();
		}

		update(
			fn: (value: { property: keyof T; update: boolean; read: boolean }) => {
				property: keyof T;
				update: boolean;
				read: boolean;
			}
		) {
			this.set(fn(this.data));
		}

		subscribe(fn: (value: { property: keyof T; update: boolean; read: boolean }) => void) {
			this.subscribers.add(fn);
			fn(this.data);

			return () => {
				this.subscribers.delete(fn);
			};
		}
	}

	export class StructPermissions<T extends Blank>
		implements
			Writable<{
				properties: StructProperty<T>[];
				permissions: Permissions;
			}>
	{
		public static stringify(permissions: StructPermissions<Blank>[]) {
			// return attempt(() => {
			//     if (!permissions.length)
			//         throw new PermissionError('No permissions found');
			//     const roles = permissions
			//         .map(i => i.role)
			//         .filter((v, i, a) => a.indexOf(v) === i);
			//     if (roles.length > 1) {
			//         throw new PermissionError('Multiple roles detected');
			//     }

			//     let str = '';

			//     for (const p of permissions) {
			//         for (const prop of p.data.properties) {
			//             if (!prop.data.property)
			//                 throw new PermissionError('Property not found');
			//             if (prop.data.read) {
			//                 str +=
			//                     [
			//                         'read',
			//                         String(p.struct.data.name),
			//                         String(prop.data.property)
			//                     ]
			//                         .map(encode)
			//                         .join(',') + ';';
			//             }
			//             if (prop.data.update && prop.data.read) {
			//                 str +=
			//                     [
			//                         'update',
			//                         String(p.struct.data.name),
			//                         String(prop.data.property)
			//                     ]
			//                         .map(encode)
			//                         .join(',') + ';';
			//             }
			//         }

			//         for (const [key, value] of Object.entries(
			//             p.data.permissions
			//         )) {
			//             if (value) {
			//                 str +=
			//                     [key, String(p.struct.data.name), '']
			//                         .map(encode)
			//                         .join(',') + ';';
			//             }
			//         }
			//     }

			//     return str;
			// });
			return attempt(() => {
				return JSON.stringify(
					permissions.map((i) => ({
						struct: i.struct.data.name,
						properties: i.data.properties
							.filter((i) => i.data.read || i.data.update)
							.map((i) => ({
								property: i.data.property,
								read: i.data.read,
								update: i.data.update
							})),
						permissions: i.data.permissions
					}))
				);
			});
		}

		public static save(permissions: StructPermissions<Blank>[]) {
			return attemptAsync(async () => {
				if (!permissions.length) throw new PermissionError('No permissions found');
				const roles = permissions.map((i) => i.role).filter((v, i, a) => a.indexOf(v) === i);
				if (roles.length > 1) {
					throw new PermissionError('Multiple roles detected');
				}

				const str = StructPermissions.stringify(permissions).unwrap();

				const [role] = roles;

				// Cannot save permissions for a role with all permissions.
				if (role.data.permissions?.includes('"*"')) {
					return;
				}

				Role.call('update-permissions', {
					role: role.data.id,
					permissions: str,
				});
			});
		}

		public static getAll(role: RoleData) {
			if (role.data.permissions === undefined) return [];
			const all: ({
				permission: PropertyAction | DataAction;
				struct: string;
				property?: string;
			} | '*')[] = JSON.parse(role.data.permissions);
			return getPermissionStructs().map((s) => {
				const p = new StructPermissions(
					s,
					role,
					Object.keys(s.data.structure).map((i) => new StructProperty(i, false, false)),
					{
						create: false,
						delete: false,
						'read-archive': false,
						archive: false,
						'restore-archive': false,
						'read-version-history': false,
						'restore-version': false,
						'delete-version': false
					}
				);

				if (all.includes('*')) {
					p.set({
						permissions: {
							create: true,
							delete: true,
							'read-archive': true,
							archive: true,
							'restore-archive': true,
							'read-version-history': true,
							'restore-version': true,
							'delete-version': true
						},
						properties: p.data.properties.map((sp) => {
							sp.set({
								property: sp.data.property,
								read: true,
								update: true
							});
							return sp;
						})
					});
					return p;
				}

				const filtered = all
					.filter((i) => i !== '*')
					.filter((i) => i.struct === s.data.name);

				for (const f of filtered) {
					if (f.property) {
						const property = p.data.properties.find((i) => i.data.property === f.property);
						if (property) {
							if (f.permission === 'read') {
								property.data.read = true;
							}
							if (f.permission === 'update') {
								property.data.update = true;
							}
						}
					} else {
						p.data.permissions[f.permission as keyof typeof p.data.permissions] = true;
					}
				}

				return p;
			});
		}

		public static getTrue(role: RoleData) {
			return StructPermissions.getAll(role).filter((i) => {
				const properties = i.data.properties.filter((i) => i.data.read || i.data.update);
				const permissions = Object.values(i.data.permissions).filter((i) => i);
				return properties.length || permissions.length;
			});
		}

		private data: {
			properties: StructProperty<T>[];
			permissions: Permissions;
		};

		private readonly subscribers: Set<
			(value: { properties: StructProperty<T>[]; permissions: Permissions }) => void
		> = new Set();

		constructor(
			public readonly struct: Struct<T>,
			public readonly role: RoleData,
			properties: StructProperty<T>[],
			permissions: Permissions
		) {
			this.data = {
				properties,
				permissions
			};
		}

		private _onAllUnsubscribe?: () => void;

		inform() {
			this.subscribers.forEach((sub) => sub(this.data));
		}

		set(value: { properties: StructProperty<T>[]; permissions: Permissions }) {
			this.data = value;
			this.inform();
		}

		update(
			fn: (value: { properties: StructProperty<T>[]; permissions: Permissions }) => {
				properties: StructProperty<T>[];
				permissions: Permissions;
			}
		) {
			this.set(fn(this.data));
		}

		subscribe(run: (value: { properties: StructProperty<T>[]; permissions: Permissions }) => void) {
			this.subscribers.add(run);
			run(this.data);

			return () => {
				this.subscribers.delete(run);
				if (!this.subscribers.size && this._onAllUnsubscribe) {
					this._onAllUnsubscribe();
				}
			};
		}

		onAllUnsubscribe(fn: () => void) {
			this._onAllUnsubscribe = fn;
		}

		reset() {
			return attempt(() => {
				this.set({
					permissions: {
						create: false,
						delete: false,
						'read-archive': false,
						archive: false,
						'restore-archive': false,
						'read-version-history': false,
						'restore-version': false,
						'delete-version': false
					},
					properties: this.data.properties.map(
						(i) => new StructProperty<T>(i.data.property, false, false)
					)
				});
			});
		}
	}

	export const Role = new Struct({
		name: 'role',
		socket: sse,
		structure: {
			name: 'string',
			universe: 'string',
			permissions: 'string', // DataPermission[]
			description: 'string',
			links: 'string' // used on the front end to show/hide links (csv)
		},
		browser,
		// log: true,
	});

	export type RoleData = StructData<typeof Role.data.structure>;

	// export const RoleAccount = new Struct({
	// 	name: 'role_account',
	// 	socket: sse,
	// 	structure: {
	// 		role: 'string',
	// 		account: 'string'
	// 	},
	// 	browser,
	// });

	// export const removeRole = (account: Account.AccountData, role: RoleData) => {
	// 	return attemptAsync(async () => {
	// 		const ra = (
	// 			await RoleAccount.fromProperty('account', account.data.id, true).await()
	// 		).unwrap();
	// 		const roleAccount = ra.find((i) => i.data.role === role.data.id);
	// 		if (!roleAccount) return;
	// 		(await roleAccount.delete()).unwrap();
	// 	});
	// };

	export const givePermissions = async (role: RoleData, permissions: unknown[]) => {
		return attemptAsync(async () => {});
	};

	export const getLinks = (role: RoleData) => {
		return attempt(() => {
			return role.data.links ? JSON.parse(role.data.links) : [];
		});
	}

	export const usersFromRole = (role: RoleData) => {
		return Account.Account.query('users-from-role', {
			role: role.data.id,
		}, {
			asStream: false,
			satisfies: () => false,
		});
	};
}
