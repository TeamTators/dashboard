import { WritableBase } from "$lib/utils/writables";
import type { Point2D } from "math/point";
import { type RobotConfig, Simulator, FIELD_LENGTH, FIELD_WIDTH } from "./new-sim";
import { Form } from "$lib/utils/form";

export type State = {
    position: Point2D | undefined; // undefined if irrelevant, will use the next state's targetPosition
    orientation: number | undefined; // degrees, undefined if irrelevant, will use the next state's targetOrientation
    duration: number; // ms since prev state
    config: RobotConfig;
    comment: string;
    vision: boolean;
};

export class Point {
    resolvedState: State | undefined;
    doByState?: State;
    doHereState?: State;

    constructor(
        public position: Point2D,
        public orientation: number,
        public tick: number
    ) {}

    setDoByState(config: {
        duration: number;
        config: RobotConfig;
        comment: string;
        vision: boolean;
    }) {
        this.doByState = {
            position: this.position,
            orientation: this.orientation,
            duration: config.duration,
            config: config.config,
            comment: config.comment,
            vision: config.vision,
        }

        return this.doByState;
    }

    setDoHereState(config: {
        duration: number;
        config: RobotConfig;
        comment: string;
        vision: boolean;
    }) {
        this.doHereState = {
            position: this.position,
            orientation: this.orientation,
            duration: config.duration,
            config: config.config,
            comment: config.comment,
            vision: config.vision,
        }

        return this.doHereState;
    }

}

export type SimulatorControllerState = {
    state: 'tracing' | 'state-config' | 'running' | 'idle';
    states: State[];
};

export class SimulatorController extends WritableBase<SimulatorControllerState> {

    public points: Point[] = [];

    constructor(public readonly sim: Simulator, state: SimulatorControllerState) {
        super(state);
        this.points = [];
    }

    get states() {
        return this.points.filter(p => p.doByState).map(p => p.doByState!);
    }

    init(target: HTMLDivElement) {
        this.sim.clearDraw();
        this.update(state => ({
            ...state,
            state: 'state-config',
        }))
        this.points = this.sim.points.map((p, i) => new Point(p.position, p.orientation, i));

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${FIELD_LENGTH} ${FIELD_WIDTH}`);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        target.appendChild(svg);

        for (const p of this.points) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', p.position[0].toString());
            circle.setAttribute('cy', p.position[1].toString());
            circle.setAttribute('r', '.1');
            circle.setAttribute('fill', 'red');
            circle.style.cursor = 'pointer';
            circle.addEventListener('click', async () => {
                const res = await new Form()
                    .input('Do By or Do Here', {
                        type: 'radio',
                        label: 'Set State Type',
                        value: 'doBy',
                        required: true,
                        options: [
                            { label: 'Do By State', value: 'doBy' },
                            { label: 'Do Here State', value: 'doHere' },
                        ]
                    })
                    .input('duration', {
                        type: 'number',
                        label: 'Duration (ms)',
                        value: p.doByState ? p.doByState.duration.toString() : '1000',
                        required: true,
                    })
                    .input('comment', {
                        type: 'textarea',
                        label: 'Comment',
                        value: p.doByState ? p.doByState.comment : '',
                        required: false,
                    })
                    .input('vision', {
                        type: 'radio',
                        label: 'Enable Vision',
                        value: p.doByState ? p.doByState.vision.toString() : 'true',
                        required: false,
                        options: [
                            { label: 'Enable Vision', value: 'true' },
                            { label: 'Disable Vision', value: 'false' },
                        ]
                    })
                    .input('maxVelocity',  {
                        type: 'number',
                        label: 'Max Velocity (ft/s)',
                        value: p.doByState ? p.doByState.config.maxVelocity.toString() : this.sim.robot.data.maxVelocity.toString(),
                        required: true,
                    })
                    .input('acceleration', {
                        type: 'number',
                        label: 'Acceleration (ft/s²)',
                        value: p.doByState ? p.doByState.config.acceleration.toString() : this.sim.robot.data.acceleration.toString(),
                        required: true,
                    })
                    .input('maxAngularVelocity', {
                        type: 'number',
                        label: 'Max Angular Velocity (°/s)',
                        value: p.doByState ? p.doByState.config.maxAngularVelocity.toString() : this.sim.robot.data.maxAngularVelocity.toString(),
                        required: true,
                    })
                    .input('angularAcceleration', {
                        type: 'number',
                        label: 'Angular Acceleration (°/s²)',
                        value: p.doByState ? p.doByState.config.angularAcceleration.toString() : this.sim.robot.data.angularAcceleration.toString(),
                        required: true,
                    })
                    .input('deceleration', {
                        type: 'number',
                        label: 'Deceleration (ft/s²)',
                        value: p.doByState ? p.doByState.config.deceleration.toString() : this.sim.robot.data.deceleration.toString(),
                        required: true,
                    })
                    .input('angularDeceleration', {
                        type: 'number',
                        label: 'Angular Deceleration (°/s²)',
                        value: p.doByState ? p.doByState.config.angularDeceleration.toString() : this.sim.robot.data.angularDeceleration.toString(),
                        required: true,
                    })
                    .prompt({
                        title: 'Set State for Point at Tick ' + p.tick,
                        send: false,
                    })
                    .unwrap();

                if (res.value['Do By or Do Here'] === 'doBy') {
                    p.setDoByState({
                        duration: Number(res.value.duration),
                        comment: res.value.comment,
                        vision: res.value.vision === 'true',
                        config: {
                            maxVelocity: Number(res.value.maxVelocity),
                            acceleration: Number(res.value.acceleration),
                            maxAngularVelocity: Number(res.value.maxAngularVelocity),
                            angularAcceleration: Number(res.value.angularAcceleration),
                            deceleration: Number(res.value.deceleration),
                            angularDeceleration: Number(res.value.angularDeceleration),
                            length: this.sim.robot.data.length,
                            width: this.sim.robot.data.width,
                        }
                    });
                } else {
                    p.setDoHereState({
                        duration: Number(res.value.duration),
                        comment: res.value.comment,
                        vision: res.value.vision === 'true',
                        config: {
                            maxVelocity: Number(res.value.maxVelocity),
                            acceleration: Number(res.value.acceleration),
                            maxAngularVelocity: Number(res.value.maxAngularVelocity),
                            angularAcceleration: Number(res.value.angularAcceleration),
                            deceleration: Number(res.value.deceleration),
                            angularDeceleration: Number(res.value.angularDeceleration),
                            length: this.sim.robot.data.length,
                            width: this.sim.robot.data.width,
                        }
                    });
                }
        

                circle.setAttribute('fill', 'green');
            });
            circle.onmouseover = () => {
                circle.setAttribute('r', '.2');
                circle.setAttribute('fill', 'blue');
            }
            circle.onmouseout = () => {
                circle.setAttribute('r', '.1');
                if (p.doByState) {
                    circle.setAttribute('fill', 'green');
                } else {
                    circle.setAttribute('fill', 'red');
                }
            }
            svg.appendChild(circle);
        }

        return () => {
            target.removeChild(svg);
            this.update(state => ({
                ...state,
                state: 'idle',
            }))
        }
    }

    async run(debug: boolean) {
        if (!this.sim.running) {
            throw new Error("Simulator must be running to execute controller");
        }

        this.update(state => ({
            ...state,
            state: 'running',
        }));

        this.sim.set({
            ...this.sim.data,
            currentPose: {
                position: this.points[0].position,
                orientation: this.points[0].orientation,
            },
            prevPose: undefined,
            prevAngularVelocity: 0,
            prevVelocity: [0, 0],
        });

        // Create trace segments based on doHereState markers
        const traceSegments: Array<{
            points: Point[];
            doHereState?: State;
        }> = [];

        let currentSegment: Point[] = [];
        
        for (const point of this.points) {
            currentSegment.push(point);
            
            if (point.doHereState) {
                // End current segment with this doHereState
                traceSegments.push({
                    points: [...currentSegment],
                    doHereState: point.doHereState,
                });
                currentSegment = [];
            }
        }
        
        // Add final segment if there are remaining points
        if (currentSegment.length > 0) {
            traceSegments.push({
                points: currentSegment,
            });
        }

        // Execute each trace segment
        for (let segmentIndex = 0; segmentIndex < traceSegments.length; segmentIndex++) {
            const segment = traceSegments[segmentIndex];
            await this.executeTraceSegment(segment, debug);
        }
    }

    private async executeTraceSegment(segment: {
        points: Point[];
        doHereState?: State;
    }, debug: boolean) {
        const log = (...args: unknown[]) => {
            if (debug) {
                console.log('[Controller]', ...args);
            }
        };
        log('Starting trace segment execution', segment);

        if (segment.points.length === 0) return;

    }
}