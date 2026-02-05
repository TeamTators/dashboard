/**
 * @fileoverview Interactive strategy whiteboard rendering and editing.
 *
 * @description
 * Provides SVG-based whiteboard paths with undo/redo stack and context menu tools.
 */
import type { Strategy } from '$lib/model/strategy';
import { contextmenu } from '$lib/utils/contextmenu';
import { Stack } from '$lib/utils/stack';
import { WritableBase } from '$lib/services/writables';
import { Color } from 'colors/color';
import type { Point2D } from 'math/point';
// import { catmullRom } from 'math/spline';
import type { TBAEvent, TBAMatch } from 'tatorscout/tba';
import { attempt, SimpleEventEmitter } from 'ts-utils';
import z from 'zod';

export type WhiteboardConfig = {
	target: HTMLDivElement;
	event: TBAEvent;
	match: TBAMatch;
};

export type PathState = {
	points: Point2D[];
	color: string;
	selected: boolean;
	id: number;
};

export type WhiteboardState = {
	paths: Path[];
};

const CLICK_THRESHOLD = 100; // ms before mouseup to consider as click

export class Path extends WritableBase<PathState> {
	constructor(
		public readonly whiteboard: Whiteboard,
		public readonly target: SVGPathElement,
		state: PathState
	) {
		super(state);
	}

	get color() {
		return this.data.color;
	}

	get points() {
		return this.data.points;
	}

	/**
	 * Remove this path from the whiteboard and DOM.
	 *
	 * @returns {void} No return value.
	 */
	remove() {
		this.whiteboard.update((wb) => {
			wb.paths = wb.paths.filter((p) => p.data.id !== this.data.id);
			return wb;
		});
		this.target.remove();
		this.whiteboard.emit('update');
	}

	/**
	 * Append a point to the path and re-render.
	 *
	 * @returns {void} No return value.
	 */
	add(point: Point2D) {
		this.data.points.push(point);
		this.inform();
		this.whiteboard.emit('update');
	}

	/**
	 * Draw the SVG path based on current points and selection state.
	 *
	 * @returns {void} No return value.
	 */
	draw() {
		this.target.setAttribute('stroke-linecap', 'round');
		this.target.setAttribute('stroke-width', '0.01');
		this.target.setAttribute('fill', 'none');
		this.target.setAttribute('filter', 'drop-shadow(0 0 0.005 white)');
		if (this.data.selected) {
			this.target.setAttribute('stroke', Color.fromName('yellow').setAlpha(0.8).toString('rgba'));
		} else {
			this.target.setAttribute('stroke', this.color);
		}
		let d = '';
		for (let i = 0; i < this.points.length; i++) {
			const [x, y] = this.points[i];
			// SVG uses viewBox 0 0 1 1, so use normalized coordinates
			d += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
		}
		// const fn = catmullRom(this.points);
		// const points = 2 * this.points.length; // More points for smoother curves
		// for (let i = 0; i < 1; i +=  1 / points) {
		//     const [x, y] = fn(i);
		//     d += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
		// }
		this.target.setAttribute('d', d);
	}

	/**
	 * Initialize event listeners for the path element.
	 *
	 * @returns {() => void} Cleanup function to remove listeners.
	 */
	init() {
		const oncontextmenu = (e: PointerEvent) => {
			this.select();
			e.preventDefault();
			contextmenu(e, {
				options: [
					'Options',
					{
						name: 'Cancel',
						icon: {
							type: 'material-icons',
							name: 'close'
						},
						action: () => {}
					},
					{
						name: 'Delete Path',
						icon: {
							type: 'material-icons',
							name: 'delete'
						},
						action: () => {
							this.remove();
						}
					}
				],
				width: '100px'
			});
		};
		const unsub = this.subscribe(() => {
			requestAnimationFrame(() => this.draw());
		});
		this.target.addEventListener('click', oncontextmenu);
		this.target.addEventListener('contextmenu', oncontextmenu);

		// Synthesize click from touch events for mobile
		let touchStartTime: number | null = null;
		let touchStartX: number | null = null;
		let touchStartY: number | null = null;
		const TOUCH_CLICK_THRESHOLD = 200; // ms
		const TOUCH_MOVE_THRESHOLD = 10; // px

		const onTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				touchStartTime = Date.now();
				touchStartX = e.touches[0].clientX;
				touchStartY = e.touches[0].clientY;
			}
		};
		const onTouchEnd = (e: TouchEvent) => {
			if (
				touchStartTime !== null &&
				e.changedTouches.length === 1 &&
				touchStartX !== null &&
				touchStartY !== null
			) {
				const dt = Date.now() - touchStartTime;
				const dx = e.changedTouches[0].clientX - touchStartX;
				const dy = e.changedTouches[0].clientY - touchStartY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dt < TOUCH_CLICK_THRESHOLD && dist < TOUCH_MOVE_THRESHOLD) {
					// Synthesize click event
					oncontextmenu(
						new PointerEvent('click', {
							clientX: e.changedTouches[0].clientX,
							clientY: e.changedTouches[0].clientY
						})
					);
				}
			}
			touchStartTime = null;
			touchStartX = null;
			touchStartY = null;
		};
		this.target.addEventListener('touchstart', onTouchStart);
		this.target.addEventListener('touchend', onTouchEnd);

		return () => {
			this.target.removeEventListener('click', oncontextmenu);
			this.target.removeEventListener('contextmenu', oncontextmenu);
			this.target.removeEventListener('touchstart', onTouchStart);
			this.target.removeEventListener('touchend', onTouchEnd);
			unsub();
		};
	}

	/**
	 * Select this path and clear other selections.
	 *
	 * @returns {void} No return value.
	 */
	select() {
		this.whiteboard.clearSelection();
		this.data.selected = true;
		this.inform();
	}
}

export class Whiteboard extends WritableBase<WhiteboardState> {
	private readonly em = new SimpleEventEmitter<'update' | 'destroy'>();

	public readonly on = this.em.on.bind(this.em);
	public readonly off = this.em.off.bind(this.em);
	public readonly once = this.em.once.bind(this.em);
	public readonly emit = this.em.emit.bind(this.em);

	/**
	 * Hydrate a whiteboard from stored data.
	 *
	 * @returns {ReturnType<typeof attempt>} Result wrapper containing the whiteboard.
	 */
	public static from(config: WhiteboardConfig, data: Strategy.MatchWhiteboardData) {
		return attempt(() => {
			if (!data.data.board) throw new Error('No board data');
			const rendered = z
				.object({
					paths: z.array(
						z.object({
							points: z.array(z.tuple([z.number(), z.number()])),
							color: z.string()
						})
					)
				})
				.parse(JSON.parse(data.data.board));

			const wb = new Whiteboard(config, {
				paths: []
			});
			for (const pathData of rendered.paths) {
				const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				wb.svg.appendChild(pathEl);
				const path = new Path(wb, pathEl, {
					points: pathData.points,
					color: pathData.color,
					selected: false,
					id: wb.data.paths.length
				});
				wb.on('destroy', path.init());
				wb.data.paths.push(path);
			}
			return wb;
		});
	}

	/**
	 * Create a blank whiteboard state.
	 *
	 * @returns {WhiteboardState} Empty state object.
	 */
	public static blank() {
		return {
			paths: []
		};
	}

	public readonly svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	public readonly stack = new Stack({
		name: 'whiteboard'
	});

	constructor(
		public readonly config: WhiteboardConfig,
		state: WhiteboardState
	) {
		super(state);
	}

	get matchNumber(): number {
		return this.config.match.match_number;
	}

	get compLevel(): string {
		return this.config.match.comp_level;
	}

	get year(): number {
		return this.config.event.year;
	}

	get target(): HTMLDivElement {
		return this.config.target;
	}

	get paths() {
		return this.data.paths;
	}

	/**
	 * Initialize DOM and interaction handlers for the whiteboard.
	 *
	 * @returns {() => void} Cleanup function to remove handlers.
	 */
	init() {
		Stack.use(this.stack);
		this.target.style.position = 'relative';
		this.target.style.width = '100%';
		this.target.style.height = '100%';

		const field = document.createElement('img');
		field.src = `/assets/field/${this.year}.png`;
		field.style.position = 'absolute';
		field.style.top = '0';
		field.style.left = '0';
		field.style.width = '100%';
		field.style.height = '100%';
		this.target.append(field);

		this.svg.setAttribute('viewBox', '0 0 2 1');
		this.svg.style.position = 'absolute';
		this.svg.style.top = '0';
		this.svg.style.left = '0';
		this.svg.style.width = '100%';
		this.svg.style.height = '100%';
		this.target.append(this.svg);

		let currentPath: Path | undefined = undefined;
		const deinit: (() => void)[] = [];
		let timeout: ReturnType<typeof setTimeout> | null = null;

		const push = (point: Point2D) => {
			if (!currentPath) return;
			const rect = this.target.getBoundingClientRect();
			const normalizedX = ((point[0] - rect.left) * 2) / rect.width;
			const normalizedY = (point[1] - rect.top) / rect.height;
			const normalizedPoint: Point2D = [normalizedX, normalizedY];
			currentPath.add(normalizedPoint);
		};

		const createPath = (point: Point2D) => {
			this.clearSelection();
			const color = Color.fromName('white').setAlpha(0.8).toString('rgba');
			const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			this.svg.appendChild(pathEl);
			const p = new Path(this, pathEl, {
				points: [],
				color,
				selected: false,
				id: this.data.paths.length
			});
			deinit.push(p.init());
			this.data.paths.push(p);
			this.inform();
			push(point);
			this.pipe(p);

			this.stack.push({
				do: () => {
					this.data.paths.push(p);
					this.svg.appendChild(pathEl);
					p.inform();
				},
				undo: () => {
					this.data.paths = this.data.paths.filter((path) => !Object.is(path, p));
					pathEl.remove();
					this.inform();
				},
				name: 'Add Path'
			});

			currentPath = p;
		};

		const down = (point: Point2D) => {
			timeout = setTimeout(() => {
				createPath(point);
			}, CLICK_THRESHOLD);
		};
		const move = (point: Point2D) => {
			if (currentPath) {
				push(point);
			}
		};
		const up = (point: Point2D) => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			// Only finish the path if it was actually started (i.e., user held long enough)
			if (currentPath) {
				push(point);
				currentPath = undefined;

				this.emit('update');
			}
		};

		const mousedown = (e: MouseEvent) => {
			// not right click
			if (e.button !== 0) return;
			e.preventDefault();
			down([e.clientX, e.clientY]);
		};
		const mousemove = (e: MouseEvent) => {
			e.preventDefault();
			move([e.clientX, e.clientY]);
		};
		const mouseup = (e: MouseEvent) => {
			e.preventDefault();
			up([e.clientX, e.clientY]);
		};

		const touchstart = (e: TouchEvent) => {
			e.preventDefault();
			if (e.touches.length > 0) {
				down([e.touches[0].clientX, e.touches[0].clientY]);
			}
		};
		const touchmove = (e: TouchEvent) => {
			e.preventDefault();
			if (e.touches.length > 0) {
				move([e.touches[0].clientX, e.touches[0].clientY]);
			}
		};
		const touchend = (e: TouchEvent) => {
			e.preventDefault();
			// Use changedTouches for end event
			if (e.changedTouches.length > 0) {
				up([e.changedTouches[0].clientX, e.changedTouches[0].clientY]);
			}
		};

		this.target.addEventListener('mousedown', mousedown);
		this.target.addEventListener('mousemove', mousemove);
		this.target.addEventListener('mouseup', mouseup);
		this.target.addEventListener('touchstart', touchstart);
		this.target.addEventListener('touchmove', touchmove);
		this.target.addEventListener('touchend', touchend);
		this.target.addEventListener('touchcancel', touchend);

		this.deinit = () => {
			Stack.current = undefined;
			this.target.removeEventListener('mousedown', mousedown);
			this.target.removeEventListener('mousemove', mousemove);
			this.target.removeEventListener('mouseup', mouseup);
			this.target.removeEventListener('touchstart', touchstart);
			this.target.removeEventListener('touchmove', touchmove);
			this.target.removeEventListener('touchend', touchend);
			this.target.removeEventListener('touchcancel', touchend);
			for (const fn of deinit) fn();
			this.target.innerHTML = '';
			this.emit('destroy');
		};
		return this.deinit;
	}

	deinit = () => {};

	clearSelection() {
		this.update((wb) => {
			for (const path of wb.paths) {
				path.data.selected = false;
				path.inform();
			}
			return wb;
		});
	}

	clear() {
		this.update((wb) => {
			for (const path of wb.paths) {
				path.target.remove();
			}
			wb.paths = [];
			return wb;
		});
	}

	serialize() {
		const round = (num: number) => {
			return num.toFixed(3);
		};
		const uniquePoints = new Set<string>();
		const rendered = {
			paths: this.data.paths
				.map((p) => {
					const uniquePointsArray: Point2D[] = [];
					for (const pt of p.points) {
						const pointString = JSON.stringify(pt);
						if (!uniquePoints.has(pointString)) {
							uniquePoints.add(pointString);
							uniquePointsArray.push(pt);
						}
					}
					return {
						points: uniquePointsArray,
						color: p.color
					};
				})
				.filter((p) => p.points.length > 0)
		};
		return `{"paths": [${rendered.paths.map((p) => `{"points": [${p.points.map((pt) => `[${round(pt[0])}, ${round(pt[1])}]`).join(', ')}],"color": "${p.color}"}`).join(', ')}]}`;
	}
}
