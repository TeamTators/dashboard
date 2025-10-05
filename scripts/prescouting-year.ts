import { prompt } from '../src/lib/server/cli/utils';
import { DB } from '../src/lib/server/db';
import { Logs } from '../src/lib/server/structs/log';
import { Scouting } from '../src/lib/server/structs/scouting';
import progress from 'cli-progress';

export default async () => {
	await Scouting.MatchScouting.build(DB).unwrap();
	const progressBar = new progress.SingleBar(
		{
			format: 'Updating match scouting year | {bar} | {percentage}% | {value}/{total}',
			hideCursor: true
		},
		progress.Presets.shades_classic
	);
	progressBar.start(1, 0);
	await Scouting.MatchScouting.all({ type: 'stream' }).pipe((ms) => {
		if (ms.data.year !== 0) return;
		const year = Number(/(\d+)/.exec(ms.data.eventKey)?.[1]);
		if (!year) return;
		progressBar.setTotal(progressBar.getTotal() + 1);
		ms.update({ year }).then((res) => {
			if (res.isErr()) return console.error('Error updating match scouting', res.error);
			Logs.log({
				struct: Scouting.MatchScouting.name,
				type: 'update',
				dataId: ms.data.id,
				message: 'Updated match scouting year through script',
				accountId: 'script'
			});
			progressBar.increment();
		});
	});
	progressBar.stop();
	(
		await prompt({
			message: 'Press enter to exit'
		})
	).unwrap();
};
