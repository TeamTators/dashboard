import { WritableArray, WritableBase } from '../writables';
import { contextmenu } from '$lib/utils/contextmenu';
import { type CommentConfig, Comment } from './comment';
import { type PathConfig, Path } from './path';
import { prompt } from '$lib/utils/prompts';

type StrategyConfig = {
	comments: CommentConfig[];
	paths: PathConfig[];
	red: [number, number, number];
	blue: [number, number, number];
	event: string;
	year: number;
};

export class Strategy extends WritableBase<StrategyConfig> {
	render(target: HTMLDivElement) {
		target.style.position = 'relative';
		target.style.width = '100%';
		target.style.aspectRatio = '2 / 1';

		const field = document.createElement('img');
		field.style.position = 'absolute';
		field.style.left = '0';
		field.style.top = '0';
		field.style.width = '100%';
		field.style.height = '100%';
		field.src = `/assets/field/${this.data.year}.png`;
		target.appendChild(field);
		const tools: HTMLElement[] = [];
		const registerTool = (el: HTMLElement) => {
			el.style.transition = 'opacity 0.3s';
			tools.push(el);
		};

		const unsub = this.subscribe(() => {});

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

		const onRed = () => {
			changeColor('red');
		};

		const onBlue = () => {
			changeColor('blue');
		};

		const onBlack = () => {
			changeColor('black');
		};

		const red = document.createElement('button');
		red.classList.add('btn');
		red.textContent = 'Red';
		red.style.backgroundColor = 'red';
		colorsContainer.appendChild(red);

		red.addEventListener('click', onRed);

		const blue = document.createElement('button');
		blue.classList.add('btn');
		blue.textContent = 'Blue';
		blue.style.backgroundColor = `blue`;
		colorsContainer.appendChild(blue);

		blue.addEventListener('click', onBlue);

		const black = document.createElement('button');
		black.classList.add('btn');
		black.textContent = 'Black';
		black.style.backgroundColor = `black`;
		black.style.color = 'white';
		colorsContainer.appendChild(black);

		black.addEventListener('click', onBlack);

		const teamsContainer = document.createElement('div');
		teamsContainer.style.position = 'absolute';
		teamsContainer.style.right = '10px';
		teamsContainer.style.top = '10px';
		for (const red of this.data.red) {
			const a = document.createElement('a');
			a.textContent = `${red}`;
			a.href = `/dashboard/event/${this.data.event}/team/${red}`;
			a.style.display = 'block';
			a.classList.add('btn', 'btn-danger', 'btn-sm');
			teamsContainer.appendChild(a);
		}
		for (const blue of this.data.blue) {
			const a = document.createElement('a');
			a.textContent = `${blue}`;
			a.href = `/dashboard/event/${this.data.event}/team/${blue}`;
			a.style.display = 'block';
			a.classList.add('btn', 'btn-primary', 'btn-sm');
			teamsContainer.appendChild(a);
		}
		target.appendChild(teamsContainer);
		registerTool(teamsContainer);

		const comments = new WritableArray<Comment>(
			this.data.comments.map((c) => {
				const comment = new Comment(c, {
					debounceMs: 0
				});
				comment.render(commentContainer);
				return comment;
			})
		);
		const paths = new WritableArray<Path>(
			this.data.paths.map((p) => {
				const path = new Path(p);
				path.render(svg);
				return path;
			})
		);

		const oncontextmenu = (event: PointerEvent) => {
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
							const res = await prompt('Enter comment text');
							if (!res) return;
							const newComment: CommentConfig = {
								position: [x, y],
								text: res,
								size: [150, 50]
							};
							this.update((config) => ({ ...config, comments: [...config.comments, newComment] }));
							const comment = new Comment(newComment);
							comment.render(commentContainer);
							comments.push(comment);
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
			const newPathConfig: PathConfig = {
				points: [[x, y]],
				color: currentColor
			};

			const path = new Path(newPathConfig);
			path.render(svg);
			paths.push(path);
			this.update((config) => ({ ...config, paths: [...config.paths, newPathConfig] }));
			currentPath = path;
			setHidden(true);
		};
		const move = (x: number, y: number) => {
			if (!currentPath) return;
			currentPath.update((config) => ({ ...config, points: [...config.points, [x, y]] }));
		};
		const up = () => {
			currentPath = null;
			setHidden(false);
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

		return () => {
			unsub();

			target.removeEventListener('dblclick', ondblclick);
			target.removeEventListener('contextmenu', oncontextmenu);
			target.removeEventListener('mousedown', onmousedown);
			target.removeEventListener('mousemove', onmousemove);
			target.removeEventListener('mouseup', onmouseup);
			target.removeEventListener('touchstart', ontouchstart);
			target.removeEventListener('touchmove', ontouchmove);
			target.removeEventListener('touchend', ontouchend);

			red.removeEventListener('click', onRed);
			blue.removeEventListener('click', onBlue);
			black.removeEventListener('click', onBlack);

			target.removeChild(field);
			target.removeChild(svg);
			target.removeChild(commentContainer);
		};
	}
}
