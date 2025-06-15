import { type Blank, DataArr, StructData } from 'drizzle-struct/front-end';

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
