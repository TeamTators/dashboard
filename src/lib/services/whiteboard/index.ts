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

type BoardConfig = {
	comments: CommentConfig[];
	paths: PathConfig[];
};

export class Board {
	private readonly em = new SimpleEventEmitter<'change' | 'incomming'>();

	public readonly on = this.em.on.bind(this.em);
	public readonly off = this.em.off.bind(this.em);
	public readonly emit = this.em.emit.bind(this.em);

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

	constructor(
		public data: BoardConfig,
		public readonly match?: TBAMatch
	) {}
	private readonly comments = new WritableArray<Comment>([]);
	private readonly paths = new WritableArray<Path>([]);

	private _rendered = false;
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
		if (this.match) {
			const teamsContainer = document.createElement('div');
			teamsContainer.style.position = 'absolute';
			teamsContainer.style.right = '10px';
			teamsContainer.style.top = '10px';
			const [r1, r2, r3, b1, b2, b3] = teamsFromMatch(this.match.tba);
			for (const red of [r1, r2, r3]) {
				const a = document.createElement('a');
				a.textContent = `${red}`;
				a.href = `/dashboard/event/${this.match.event.tba.key}/team/${red}`;
				a.style.display = 'block';
				a.classList.add('btn', 'btn-danger', 'btn-sm');
				teamsContainer.appendChild(a);
			}
			for (const blue of [b1, b2, b3]) {
				const a = document.createElement('a');
				a.textContent = `${blue}`;
				a.href = `/dashboard/event/${this.match.event.tba.key}/team/${blue}`;
				a.style.display = 'block';
				a.classList.add('btn', 'btn-primary', 'btn-sm');
				teamsContainer.appendChild(a);
			}
			target.appendChild(teamsContainer);
			registerTool(teamsContainer);
		}

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
			let el: HTMLElement | null = event.target;
			while (el) {
				if (el.classList.contains('comment')) return true;
				el = el.parentElement;
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

		const onmouseup = () => {
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

		registerSub(
			this.on('incomming', () => {
				cleanup();
				this.render(target, stack);
			})
		);

		const cleanup = () => {
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

			target.removeChild(field);
			target.removeChild(svg);
			target.removeChild(commentContainer);
			this._rendered = false;
		};
		return cleanup;
	}

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

	setState(data: BoardConfig) {
		this.data = data;
		this.emit('incomming');
	}
}
