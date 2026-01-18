import { contextmenu } from "$lib/utils/contextmenu";
import { WritableBase } from "$lib/utils/writables";
import { Color } from "colors/color";
import type { Point2D } from "math/point";

export type WhiteboardConfig = {
    year: number;
    target: HTMLDivElement;
}

export type PathState = {
    points: Point2D[];
    color: string;
};

export type WhiteboardState = {
    paths: Path[];
};

export class Path extends WritableBase<PathState> {
    constructor(
        public readonly whiteboard: Whiteboard,
        public readonly target: SVGPathElement,
        state: PathState,
    ) {
        super(state);
    }

    get color() {
        return this.data.color;
    }

    get points() {
        return this.data.points;
    }
    
    remove() {
        this.whiteboard.update((wb) => {
            wb.paths = wb.paths.filter(p => Object.is(p, this));
            return wb;
        });
        this.inform();
    }

    add(point: Point2D) {
        this.data.points.push(point);
        this.inform();
    }

    draw() {
        this.target.setAttribute('stroke-linecap', 'rounded');
        this.target.setAttribute('stroke-width', '10');
        this.target.setAttribute('fill', 'none');
        this.target.setAttribute('stroke', this.color);
        let d = '';
        for (let i = 0; i < this.points.length; i++) {
            const [x, y] = this.points[i];
            d += `${i === 0 ? 'M' : 'L'} ${x * 2} ${y}`;
        }

        this.target.setAttribute('d', d);
    }

    init() {
        const oncontextmenu = (e: PointerEvent) => {
            e.preventDefault();
            contextmenu(e, {
                options: [],
                width: '100px',
            });
        };
        const unsub = this.subscribe(() => {
            this.draw();
        });
        this.target.addEventListener('contextmenu', oncontextmenu);
        return () => {
            this.target.removeEventListener('contextmenu', oncontextmenu);
            unsub();
        };
    }
}

export class Whiteboard extends WritableBase<WhiteboardState> {
    public readonly svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    constructor(
        public readonly config: Whiteboard,
        state: WhiteboardState,
    ) {
        super(state);
    }

    get year(): number {
        return this.config.year;
    }

    get target(): HTMLDivElement {
        return this.config.target;
    }

    init() {
        this.target.style.position = 'relative';
        this.target.style.width = '100%';
        this.target.style.aspectRatio = '2 / 1';

        this.svg.setAttribute('viewbox', '100 50');

        const field = create('img');
        field.src = `/assets/field/${this.year}.png`;

        let currentPath: Path | undefined = undefined;
        const deinit: (() => void)[] = [];


        const push = (point: Point2D) => {
            if (!currentPath) return;
            currentPath.add(point);
        };

        const down = (point: Point2D) => {
            const color = Color.fromName('gray').setAlpha(0.8).toString('rgba')
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            this.svg.appendChild(pathEl);

            currentPath = new Path(this, pathEl, {
                points: [],
                color,
            });
            deinit.push(currentPath.init());
            this.data.paths.push(currentPath);
            this.inform();
            push(point);
        };
        const move = (point: Point2D) => {
            push(point);
        };
        const up = (point: Point2D) => {
            push(point);
            currentPath = undefined;
        };

        const mousedown = (e: MouseEvent) => {
            down(
                [
                    e.clientX,
                    e.clientY
                ]
            );
        };
        const mousemove = (e: MouseEvent) => {
            move(
                [
                    e.clientX,
                    e.clientY
                ]
            );
        };
        const mouseup = (e: MouseEvent) => {
            up(
                [
                    e.clientX,
                    e.clientY
                ]
            );
        };

        const touchstart = (e: TouchEvent) => {
            down(
                [
                    e.touches[0].clientX,
                    e.touches[1].clientY,
                ]
            );
        };
        const touchmove = (e: TouchEvent) => {
            move(
                [
                    e.touches[0].clientX,
                    e.touches[1].clientY,
                ]
            );
        };
        const touchend = (e: TouchEvent) => {
            up(
                [
                    e.touches[0].clientX,
                    e.touches[1].clientY,
                ]
            );
        };

        this.target.addEventListener('mousedown', mousedown);
        this.target.addEventListener('mousemove', mousemove);
        this.target.addEventListener('mouseup', mouseup);
        this.target.addEventListener('touchstart', touchstart);
        this.target.addEventListener('touchmove', touchmove);
        this.target.addEventListener('touchend', touchend);
        this.target.addEventListener('touchcancel', touchend);

        return () => {
            this.target.removeEventListener('mousedown', mousedown);
            this.target.removeEventListener('mousemove', mousemove);
            this.target.removeEventListener('mouseup', mouseup);
            this.target.removeEventListener('touchstart', touchstart);
            this.target.removeEventListener('touchmove', touchmove);
            this.target.removeEventListener('touchend', touchend);
            this.target.removeEventListener('touchcancel', touchend);
            for (const fn of deinit) fn();
        };
    }
}