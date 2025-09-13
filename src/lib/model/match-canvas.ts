// import { Canvas, Container, Path, Circle, Img, SVG } from "canvas";
import { Canvas } from 'canvas/canvas';
import { Container } from 'canvas/container';
import { Path } from 'canvas/path';
import { Circle } from 'canvas/circle';
import { Img } from 'canvas/image';
import { type TraceArray, type Action, Trace } from 'tatorscout/trace';
import type { Focus } from '$lib/types/robot-display';

const generateAction = (x: number, y: number, action: Action, color: string) => {
	const c = new Circle([x, y], 0.025);
	// c.fill.color = color;
	c.properties.fill.color = color;
	c.properties.line.color = 'transparent';
	const svg = new Img(`/assets/icons/${action}.png`, {
		x: x - 0.025,
		y: y - 0.025,
		width: 0.05,
		height: 0.05
	});
	svg.text.color = 'black';
	return new Container(c, svg);
};

const ACTION_COLORS: Record<Action, string> = {
	amp: 'red',
	bal: 'blue',
	cbe: 'green',
	clb: 'yellow',
	cne: 'purble',
	lob: 'orange',
	nte: 'black',
	pck: 'white',
	spk: 'pink',
	src: 'brown',
	trp: 'cyan',
	cl1: 'red',
	cl2: 'blue',
	cl3: 'yellow',
	cl4: 'green',
	brg: 'purple',
	prc: 'orange',
	dpc: 'black',
	shc: 'white'
};

const SECTION_COLORS = {
	auto: 'green',
	teleop: 'blue',
	endgame: 'red'
};

export class MatchCanvas {
	private doActions = true;
	private doPath = true;
	private min = 0;
	private max: number;
	private _focus?: Focus;

	public readonly canvas: Canvas;
	public readonly container = new Container();
	public readonly background: Img;
	public readonly trace: TraceArray;

	constructor(
		trace: TraceArray,
		public readonly year: number,
		public readonly ctx: CanvasRenderingContext2D
	) {
		this.trace = Trace.expand(trace);
		this.max = this.trace.length;
		this.canvas = new Canvas(ctx);
		this.canvas.ratio = 2;
		// this.canvas.adaptable = true;
		this.background = new Img(`/field/${year}.png`);

		this.init();
	}

	init() {
		this.canvas.clearDrawables();
		this.container.children = [];
		this.background.width = 1;
		this.background.height = 1;
		this.background.x = 0;
		this.background.y = 0;
		// start at 1 to skip the first point, a path is drawn between two points, so we're starting with the second
		for (let i = 1; i < this.trace.length; i++) {
			const a = this.trace[i - 1];
			const [, x1, y1, a1] = a;
			const b = this.trace[i];
			const [, x2, y2, a2] = b;

			// Need the i == 1 check otherwise every action will be drawn twice
			if (a1 && i == 1) {
				this.container.children.push(generateAction(x1, y1, a1, ACTION_COLORS[a1]));
			}
			const path = new Path([
				[x1, y1],
				[x2, y2]
			]);

			if (i < 15 * 4) {
				path.properties.line.color = SECTION_COLORS.auto;
			}
			if (i >= 15 * 4 && i < 135 * 4) {
				path.properties.line.color = SECTION_COLORS.teleop;
			}
			if (i >= 135 * 4) {
				path.properties.line.color = SECTION_COLORS.endgame;
			}

			this.container.children.push(path);

			if (a2) {
				this.container.children.push(generateAction(x2, y2, a2, ACTION_COLORS[a2]));
			}
		}
		this.canvas.add(this.background, this.container);
		this.setFilter();
	}

	between(min: number, max: number) {
		this.min = min;
		this.max = max;
		this.setFilter();
	}

	auto() {
		this.between(0, 15 * 4);
	}

	teleop() {
		this.between(15 * 4, 135 * 4);
	}

	endgame() {
		this.between(135 * 4, this.trace.length);
	}

	hideActions() {
		this.doActions = false;
		this.setFilter();
	}

	showActions() {
		this.doActions = true;
		this.setFilter();
	}

	toggleActions() {
		this.doActions = !this.doActions;
		this.setFilter();
	}

	showPath() {
		this.doPath = true;
		this.setFilter();
	}

	hidePath() {
		this.doPath = false;
		this.setFilter();
	}

	togglePath() {
		this.doPath = !this.doPath;
		this.setFilter();
	}

	reset() {
		this.doActions = true;
		this.doPath = true;
		this.min = 0;
		this.max = 600;
		this._focus = undefined;
		this.init();
		this.setFilter();
	}

	private setFilter() {
		let actions = 0;
		this.container.filter((drawable, i) => {
			if (this._focus) {
				const f = this._focus;
				if (!f.auto) {
					if (i < 15 * 4) return false;
				}
				if (!f.teleop) {
					if (i >= 15 * 4 && i < 135 * 4) return false;
				}
				if (!f.endgame) {
					if (i >= 135 * 4) return false;
				}
			}
			// I subtract actions from i because the action adds to the number of total items, which will move the actual time of the item off by the number of actions before the current drawable
			if (i - actions < this.min || i - actions > this.max) return false;

			if (!drawable) return false;

			if (drawable instanceof Path) {
				if (this.doPath) {
					return true;
				}
				return false;
			}

			if (drawable instanceof Container) {
				actions++;
				if (this.doActions) {
					return true;
				}
				return false;
			}

			return false;
		});
	}

	animate() {
		return this.canvas.animate();
	}

	draw() {
		this.canvas.draw();
	}

	focus(focus: Focus) {
		this._focus = focus;
		this.setFilter();
	}
}
