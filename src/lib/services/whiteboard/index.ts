import { WritableArray } from '../writables';
import { contextmenu } from '$lib/utils/contextmenu';
import { type CommentConfig, Comment } from './comment';
import { type PathConfig, Path } from './path';
import { prompt } from '$lib/utils/prompts';
import { Stack } from '$lib/utils/stack';
import { attempt, SimpleEventEmitter } from 'ts-utils';
import z from 'zod';
import type { TBAMatch } from '$lib/utils/tba';
import { teamsFromMatch } from 'tatorscout/tba';
import type { Point2D } from 'math/point';

/**
 * Configuration for a whiteboard board.
 * @typedef BoardConfig
 * @property {CommentConfig[]} comments - Array of comment configs.
 * @property {PathConfig[]} paths - Array of path configs.
 */
type BoardConfig = {
	comments: CommentConfig[];
	paths: PathConfig[];
};

const driveTeamPositions: {
	[year: number]: {
		red: [Point2D, Point2D, Point2D];
		blue: [Point2D, Point2D, Point2D];
	};
} = {
	2026: {
		red: [
			[0.05, 0.25],
			[0.05, 0.4],
			[0.05, 0.6]
		],
		blue: [
			[0.95, 0.3],
			[0.95, 0.6],
			[0.95, 0.75]
		]
	},
	2025: {
		red: [
			[0, 0.3],
			[0, 0.5],
			[0, 0.7]
		],
		blue: [
			[0.95, 0.3],
			[0.95, 0.5],
			[0.95, 0.7]
		]
	}
};

/**
 * Whiteboard board element with rendering, serialization, and state management.
 */
export class Board {
	private readonly em = new SimpleEventEmitter<'change' | 'incoming'>();

	public readonly on = this.em.on.bind(this.em);
	public readonly off = this.em.off.bind(this.em);
	public readonly emit = this.em.emit.bind(this.em);

	/**
	 * Create a Board instance from serialized data.
	 * @param {string} data - Serialized board data.
	 * @param {TBAMatch} [match] - Optional match context.
	 * @returns {Attempt<Board>} Attempt-wrapped Board instance.
	 */
	public static from(data: string, match?: TBAMatch) {
		return attempt(() => {
			const res = z
				.object({
					comments: z.array(
						z.object({
							position: z
								.tuple([z.number(), z.number()])
								.transform(([x, y]) => [x / 1000, y / 1000] as [number, number]),
							text: z.string(),
							size: z
								.tuple([z.number(), z.number()])
								.transform(([w, h]) => [w / 1000, h / 1000] as [number, number]),
							hidden: z.boolean(),
							selected: z.boolean()
						})
					),
					paths: z.array(
						z.object({
							points: z
								.array(z.tuple([z.number(), z.number()]))
								.transform((points) =>
									points.map(([x, y]) => [x / 1000, y / 1000] as [number, number])
								),
							color: z.string()
						})
					)
				})
				.parse(JSON.parse(data));
			return new Board(res, match);
		});
	}

	/**
	 * Construct a Board instance.
	 * @param {BoardConfig} data - Board configuration.
	 * @param {TBAMatch} [match] - Optional match context.
	 */
	constructor(
		public data: BoardConfig,
		public readonly match?: TBAMatch
	) {}
	private readonly comments = new WritableArray<Comment>([]);
	private readonly paths = new WritableArray<Path>([]);

	private _rendered = false;
	/**
	 * Render the board onto a div element and attach interactions.
	 * @param {HTMLDivElement} target - Div element to render into.
	 * @param {Stack} stack - Undo/redo stack.
	 * @returns {() => void} Cleanup function to cleanup board rendering.
	 */
	render(target: HTMLDivElement, stack: Stack) {
		if (this._rendered) {
			throw new Error('Strategy already rendered');
		}
		stack.on('undo', () => this.emit('change'));
		stack.on('redo', () => this.emit('change'));
		this._rendered = true;
		target.style.position = 'relative';
		target.style.width = '100%';
		target.style.aspectRatio = '2 / 1';

		const field = document.createElement('img');
		field.style.position = 'absolute';
		field.style.left = '0';
		field.style.top = '0';
		field.style.width = '100%';
		field.style.height = '100%';
		field.src = `/assets/field/${this.match?.event.tba.year || 2026}.png`;
		target.appendChild(field);

		const unsubs: (() => void)[] = [];
		const registerSub = (sub: () => void) => {
			unsubs.push(sub);
		};

		const tools: HTMLElement[] = [];
		const registerTool = (el: HTMLElement) => {
			el.style.transition = 'all 0.3s';
			tools.push(el);
		};
		if (this.match) {
			const teamsContainer = document.createElement('div');
			teamsContainer.style.position = 'absolute';
			teamsContainer.style.left = '0px';
			teamsContainer.style.top = '0px';
			teamsContainer.style.width = '100%';
			teamsContainer.style.height = '100%';
			const [r1, r2, r3, b1, b2, b3] = teamsFromMatch(this.match.tba);
			for (let i = 0; i < 3; i++) {
				const red = [r1, r2, r3][i];
				const a = document.createElement('a');
				a.textContent = `${red}`;
				a.href = `/dashboard/event/${this.match.event.tba.key}/team/${red}`;
				a.style.display = 'block';
				a.style.position = 'absolute';
				a.classList.add('btn', 'btn-danger', 'btn-lg');
				const pos = driveTeamPositions[this.match.event.tba.year]?.red[i] || [0.9, 0.1 + i * 0.1];
				a.style.left = pos[0] * 100 + '%';
				a.style.top = pos[1] * 100 + '%';
				a.style.transform = 'translate(50%, -50%)';
				a.style.zIndex = '20';
				teamsContainer.appendChild(a);
				registerTool(a);
				registerSub(() => a.remove());
			}
			for (let i = 0; i < 3; i++) {
				const blue = [b1, b2, b3][i];
				const a = document.createElement('a');
				a.textContent = `${blue}`;
				a.href = `/dashboard/event/${this.match.event.tba.key}/team/${blue}`;
				a.style.display = 'block';
				a.style.position = 'absolute';
				a.classList.add('btn', 'btn-primary', 'btn-lg');
				const pos = driveTeamPositions[this.match.event.tba.year]?.blue[i] || [0.1, 0.1 + i * 0.1];
				a.style.left = pos[0] * 100 + '%';
				a.style.top = pos[1] * 100 + '%';
				a.style.transform = 'translate(-50%, -50%)';
				a.style.zIndex = '20';
				teamsContainer.appendChild(a);
				registerTool(a);
				registerSub(() => a.remove());
			}
			target.appendChild(teamsContainer);
			registerTool(teamsContainer);
		}

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.style.position = 'absolute';
		svg.style.left = '0';
		svg.style.top = '0';
		svg.style.width = '100%';
		svg.style.height = '100%';
		target.appendChild(svg);

		const commentContainer = document.createElement('div');
		commentContainer.style.position = 'absolute';
		commentContainer.style.left = '0';
		commentContainer.style.top = '0';
		commentContainer.style.width = '100%';
		commentContainer.style.height = '100%';
		target.appendChild(commentContainer);
		registerTool(commentContainer);

		const colorsContainer = document.createElement('div');
		colorsContainer.style.position = 'absolute';
		colorsContainer.style.left = '10px';
		colorsContainer.style.top = '10px';
		colorsContainer.style.display = 'flex';
		colorsContainer.style.gap = '10px';
		target.appendChild(colorsContainer);
		registerTool(colorsContainer);

		let currentColor: string = 'black';

		const changeColor = (color: string) => (currentColor = color);

		const createColor = (name: string, color: string) => {
			const button = document.createElement('button');
			button.classList.add('btn');
			button.textContent = name;
			button.style.backgroundColor = color;
			colorsContainer.appendChild(button);
			const onchange = () => {
				changeColor(color);
			};
			button.addEventListener('click', onchange);
			registerSub(() => button.removeEventListener('click', onchange));
		};

		createColor('Red', 'red');
		createColor('Blue', 'blue');
		createColor('Black', 'black');

		const comments = this.comments;
		const paths = this.paths;

		comments.set(
			this.data.comments.map((c) => {
				const comment = new Comment(c, this);
				registerSub(comment.render(commentContainer, stack));
				return comment;
			})
		);

		paths.set(
			this.data.paths.map((p) => {
				const path = new Path(p);
				registerSub(path.render(svg));
				return path;
			})
		);

		const deselect = () => {
			comments.each((comment) => comment.deselect());
		};

		const getSelected = () => {
			return comments.data.filter((comment) => comment.data.selected);
		};

		const oncontextmenu = (event: PointerEvent) => {
			deselect();
			event.preventDefault();
			const rect = target.getBoundingClientRect();
			// normalized x and y between 0 and 1
			const x = (event.clientX - rect.left) / rect.width;
			const y = (event.clientY - rect.top) / rect.height;
			contextmenu(event, {
				options: [
					{
						name: 'Add Comment',
						icon: {
							type: 'material-icons',
							name: 'add'
						},
						action: async () => {
							const res = await prompt('Enter comment text', {
								multiline: true
							});
							if (!res) return;
							const newComment: CommentConfig = {
								position: [x, y],
								text: res,
								size: [150, 50],
								hidden: false,
								selected: true
							};
							const comment = new Comment(newComment, this);
							registerSub(comment.render(commentContainer, stack));
							stack.push({
								do: async () => {
									comments.push(comment);
									comment.show();
									this.emit('change');
								},
								undo: () => {
									comments.remove(comment);
									comment.hide();
									this.emit('change');
								},
								name: 'Add Comment'
							});
						}
					}
				],
				width: '150px'
			});
		};

		const ondblclick = (event: MouseEvent) => {
			if (isTool(event)) return;
			event.preventDefault();
			oncontextmenu(
				new PointerEvent('contextmenu', { clientX: event.clientX, clientY: event.clientY })
			);
		};

		target.addEventListener('contextmenu', oncontextmenu);
		target.addEventListener('dblclick', ondblclick);

		let currentPath: Path | null = null;

		const setHidden = (hidden: boolean) => {
			if (hidden) {
				for (const tool of tools) {
					tool.style.opacity = '0';
				}
			} else {
				for (const tool of tools) {
					tool.style.opacity = '1';
				}
			}
		};

		const down = (x: number, y: number) => {
			deselect();
			const newPathConfig: PathConfig = {
				points: [[x, y]],
				color: currentColor
			};

			const path = new Path(newPathConfig);
			let unrender = () => {};
			setHidden(true);

			stack.push({
				do: () => {
					unrender = path.render(svg);
					paths.push(path);
					currentPath = path;
				},
				undo: () => {
					unrender();
					path.destroy();
					paths.remove(path);
					currentPath = null;
				},
				name: 'Draw Path'
			});
		};
		const move = (x: number, y: number) => {
			if (!currentPath) return;
			deselect();
			currentPath.update((config) => ({ ...config, points: [...config.points, [x, y]] }));
		};
		const up = () => {
			deselect();
			currentPath = null;
			setHidden(false);
			this.emit('change');
		};

		const isTool = (event: Event) => {
			if (!(event.target instanceof HTMLElement)) return false;
			// iterate through the parents of the event target to see if any of them have the class 'comment-container'

			if (commentContainer.contains(event.target) && event.target !== commentContainer) {
				return true;
			}

			if (
				event.target instanceof HTMLButtonElement ||
				event.target.parentElement instanceof HTMLButtonElement
			) {
				return true;
			}

			return false;
		};

		const onmousedown = (event: MouseEvent) => {
			if (event.button !== 0) return;
			if (isTool(event)) return;
			event.preventDefault();
			const rect = target.getBoundingClientRect();
			const x = (event.clientX - rect.left) / rect.width;
			const y = (event.clientY - rect.top) / rect.height;
			down(x, y);
		};

		const onmousemove = (event: MouseEvent) => {
			if (event.buttons !== 1) return;
			event.preventDefault();
			const rect = target.getBoundingClientRect();
			const x = (event.clientX - rect.left) / rect.width;
			const y = (event.clientY - rect.top) / rect.height;
			move(x, y);
		};

		const onmouseup = (event: MouseEvent) => {
			if (event.button !== 0) return;
			if (isTool(event)) return;
			up();
		};

		let lastTouchStart = 0;

		const ontouchstart = (event: TouchEvent) => {
			const now = performance.now();
			if (now - lastTouchStart < 250) {
				lastTouchStart = 0;
				oncontextmenu(
					new PointerEvent('contextmenu', {
						clientX: event.touches[0].clientX,
						clientY: event.touches[0].clientY
					})
				);
				return;
			}
			lastTouchStart = now;
			if (isTool(event)) return;
			event.preventDefault();
			const rect = target.getBoundingClientRect();
			const x = (event.touches[0].clientX - rect.left) / rect.width;
			const y = (event.touches[0].clientY - rect.top) / rect.height;
			down(x, y);
		};

		const ontouchmove = (event: TouchEvent) => {
			event.preventDefault();
			const rect = target.getBoundingClientRect();
			const x = (event.touches[0].clientX - rect.left) / rect.width;
			const y = (event.touches[0].clientY - rect.top) / rect.height;
			move(x, y);
		};

		const ontouchend = () => {
			up();
		};

		target.addEventListener('mousedown', onmousedown);
		target.addEventListener('mousemove', onmousemove);
		target.addEventListener('mouseup', onmouseup);
		target.addEventListener('touchstart', ontouchstart);
		target.addEventListener('touchmove', ontouchmove);
		target.addEventListener('touchend', ontouchend);

		const onkeydown = (event: KeyboardEvent) => {
			switch (event.key) {
				case 'Escape':
					deselect();
					break;
				case 'Delete':
				case 'Backspace': {
					const selected = getSelected();
					if (selected.length === 0) return;
					stack.push({
						do: () => {
							for (const comment of selected) {
								comment.hide();
							}
							this.emit('change');
						},
						undo: () => {
							for (const comment of selected) {
								comment.show();
							}
							this.emit('change');
						},
						name: 'Delete Comment(s)'
					});
					break;
				}
			}

			if (event.ctrlKey || event.metaKey) {
				switch (event.key) {
					case 'a': {
						event.preventDefault();
						comments.each((c) => c.select());
						break;
					}
				}
			}
		};

		window.addEventListener('keydown', onkeydown);

		const prevStack = Stack.current;
		Stack.use(stack);

		const cleanup = () => {
			this._rendered = false;
			stack.clear();
			if (prevStack) {
				Stack.use(prevStack);
			} else {
				Stack.current = undefined;
			}
			for (const unsub of unsubs) {
				unsub();
			}

			target.removeEventListener('dblclick', ondblclick);
			target.removeEventListener('contextmenu', oncontextmenu);
			target.removeEventListener('mousedown', onmousedown);
			target.removeEventListener('mousemove', onmousemove);
			target.removeEventListener('mouseup', onmouseup);
			target.removeEventListener('touchstart', ontouchstart);
			target.removeEventListener('touchmove', ontouchmove);
			target.removeEventListener('touchend', ontouchend);

			window.removeEventListener('keydown', onkeydown);

			target.innerHTML = '';
			svg.remove();
			commentContainer.remove();
			colorsContainer.remove();
			for (const tool of tools) {
				tool.remove();
			}
		};
		registerSub(
			this.on('incoming', () => {
				cleanup();
				this.render(target, stack);
			})
		);
		return cleanup;
	}

	/**
	 * Serialize the board to a storable format.
	 * This will round all positions and sizes to 3 decimal places to reduce storage size while maintaining reasonable accuracy.
	 * @returns {string} Serialized board data.
	 */
	serialize() {
		const round = (num: number) => Math.round(num * 1000);
		return JSON.stringify({
			comments: this.comments.data
				.map((c) => ({
					...c.data,
					position: c.data.position.map(round) as [number, number],
					size: c.data.size.map(round) as [number, number]
				}))
				.filter((c) => !c.hidden),
			paths: this.paths.data.map((p) => ({
				...p.data,
				points: p.data.points.map(([x, y]) => [round(x), round(y)])
			}))
		});
	}

	/**
	 * Set the board state and emit update event.
	 * @param {BoardConfig} data - New board configuration.
	 */
	setState(data: BoardConfig) {
		this.data = data;
		this.emit('incoming');
	}
}
