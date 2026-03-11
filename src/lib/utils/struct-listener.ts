/**
 * @fileoverview Convenience listener for keeping a `DataArr` in sync with a Struct.
 * @description
 * Attaches to Struct lifecycle events and updates the array with minimal boilerplate.
 */

import { DataArr } from '$lib/services/struct/data-arr';
import { type Blank } from '$lib/services/struct';
import { type StructData } from '$lib/services/struct';

/**
 * Subscribes to Struct events and syncs matching records into a `DataArr`.
 * @param data - Target data array to keep in sync.
 * @param satisfies - Predicate to determine if a Struct record should be tracked.
 * @returns A cleanup function that removes all listeners.
 * @example
 * const stop = listen(users, (u) => u.data.active);
 * // later...
 * stop();
 */
export const listen = <T extends Blank>(
	data: DataArr<T>,
	satisfies: (d: StructData<T>) => boolean
) => {
	const offNew = data.struct.on('new', (d) => {
		if (satisfies(d)) {
			data.add(d);
		}
	});

	const offRestore = data.struct.on('restore', (d) => {
		if (satisfies(d)) {
			data.add(d);
		}
	});

	const offUpdate = data.struct.on('update', (d) => {
		if (satisfies(d)) {
			data.inform();
		}
	});

	const offDelete = data.struct.on('delete', (d) => {
		if (satisfies(d)) {
			data.inform();
		}
	});

	const offArchive = data.struct.on('archive', (d) => {
		if (satisfies(d)) {
			data.remove(d);
		}
	});

	return () => {
		offNew();
		offRestore();
		offUpdate();
		offDelete();
		offArchive();
	};
};
