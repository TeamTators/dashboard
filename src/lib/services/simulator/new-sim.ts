import { WritableBase } from '$lib/services/writables';
import type { Point2D } from 'math/point';
import { EventEmitter } from 'ts-utils';

export type Pose = {
	position: Point2D; // [feetX, feetY]
	orientation: number; // rad
};

export type RobotState = {
	targetPosition: Point2D | undefined;
	targetOrientation: number | undefined;
	targetFacing: [number, number] | undefined; // [feetX, feetY]
	faceTarget: boolean;
	prevTargetPosition: Point2D | undefined; // Track target position changes
	isInitialClick: boolean; // Track if this is a new click vs drag
	currentPose: Pose | undefined;
	prevPose: Pose | undefined;
	velocity: Point2D; // [feet/sX, feet/sY]
	prevVelocity: Point2D; // [feet/sX, feet/sY]
	angularVelocity: number; // rad/s
	prevAngularVelocity: number; // rad/s
};

export type RobotConfig = {
	maxVelocity: number; // feet/s
	maxAngularVelocity: number; // deg/s
	acceleration: number; // feet/s²
	angularAcceleration: number; // deg/s²
	deceleration: number; // feet/s²
	angularDeceleration: number; // deg/s²
	width: number; // feet
	length: number; // feet
};

export type ControlState = {
	rotation: 'manual' | 'target' | 'field' | 'none';
	rotationTarget: Point2D | undefined;
};

export const FIELD_WIDTH = 27; // feet
export const FIELD_LENGTH = 54; // feet

export class Simulator extends WritableBase<RobotState> {
	private readonly em = new EventEmitter<{
		tick: number;
	}>();

	public on = this.em.on.bind(this.em);
	public off = this.em.off.bind(this.em);
	public once = this.em.once.bind(this.em);

	public readonly points: Pose[] = [];

	public readonly robot: Robot;

	constructor(
		public readonly year: number,
		public readonly target: HTMLDivElement,
		robotConfig: RobotConfig
	) {
		super({
			// target state
			targetPosition: undefined,
			targetOrientation: undefined,
			targetFacing: undefined,
			prevTargetPosition: undefined,
			isInitialClick: false,
			faceTarget: false,

			// current state
			currentPose: undefined,
			velocity: [0, 0],
			angularVelocity: 0,

			// previous state (tick - 1)
			prevPose: undefined,
			prevVelocity: [0, 0],
			prevAngularVelocity: 0
		});

		this.robot = new Robot(robotConfig);
	}

	get animatedPoints() {
		return this.points.slice(-100);
	}

	get prevState() {
		return {
			pose: this.data.prevPose,
			velocity: this.data.prevVelocity,
			angularVelocity: this.data.prevAngularVelocity
		};
	}

	get currentState() {
		return {
			pose: this.data.currentPose,
			velocity: this.data.velocity,
			angularVelocity: this.data.angularVelocity
		};
	}

	get targetState() {
		let orientation: number | undefined;

		if (this.data.faceTarget && this.data.targetPosition && this.data.currentPose) {
			// When faceTarget is enabled, always face the target position
			const dx = this.data.targetPosition[0] - this.data.currentPose.position[0];
			const dy = this.data.targetPosition[1] - this.data.currentPose.position[1];
			orientation = Math.atan2(dy, dx);
		} else if (this.data.targetFacing) {
			// Normal targetFacing behavior
			orientation = Math.atan2(
				this.data.targetFacing[1] - (this.data.currentPose?.position[1] ?? 0),
				this.data.targetFacing[0] - (this.data.currentPose?.position[0] ?? 0)
			);
		} else {
			// Use explicit target orientation
			orientation = this.data.targetOrientation;
		}

		return {
			position: this.data.targetPosition,
			orientation
		};
	}

	private readonly svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	private readonly path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	private readonly robotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	private readonly targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	private readonly targetFacingCircle = document.createElementNS(
		'http://www.w3.org/2000/svg',
		'circle'
	);

	init() {
		const img = document.createElement('img');
		img.src = `/assets/field/${this.year}.png`;
		img.style.width = '100%';
		img.style.height = '100%';
		img.style.position = 'absolute';
		img.style.top = '0';
		img.style.left = '0';
		this.target.appendChild(img);

		// Set up SVG container with viewBox matching field dimensions
		this.svg.setAttribute('width', '100%');
		this.svg.setAttribute('height', '100%');
		this.svg.setAttribute('viewBox', `0 0 ${FIELD_LENGTH} ${FIELD_WIDTH}`);
		this.svg.style.position = 'absolute';
		this.svg.style.top = '0';
		this.svg.style.left = '0';
		this.target.appendChild(this.svg);

		for (const el of [this.path, this.robotGroup, this.targetCircle, this.targetFacingCircle]) {
			this.svg.appendChild(el);
		}

		this.target.style.width = '100%';
		this.target.style.aspectRatio = '2 / 1';
		this.target.style.position = 'relative';
		this.target.style.overflow = 'hidden';
		this.target.classList.add('no-select');

		return () => {};
	}

	running = false;

	start(debug: boolean) {
		if (this.running) throw new Error('Simulator is already running');
		this.running = true;
		const log = (...args: unknown[]) => {
			if (debug) {
				console.log('[Simulator]', ...args);
			}
		};

		const setTargetPos = (clientX: number, clientY: number, isInitialClick: boolean = false) => {
			if (this.paused) return;
			log('setTargetPos', clientX, clientY, isInitialClick);
			const rect = this.target.getBoundingClientRect();
			const x = ((clientX - rect.left) / rect.width) * FIELD_LENGTH;
			const y = ((clientY - rect.top) / rect.height) * FIELD_WIDTH;
			this.update((state) => ({
				...state,
				prevTargetPosition: isInitialClick ? state.targetPosition : state.prevTargetPosition,
				targetPosition: [x, y],
				isInitialClick
			}));
		};

		const setTargetOrientation = (clientX: number, clientY: number) => {
			if (this.paused) return;
			log('setTargetOrientation', clientX, clientY);
			const rect = this.target.getBoundingClientRect();
			const x = ((clientX - rect.left) / rect.width) * FIELD_LENGTH;
			const y = ((clientY - rect.top) / rect.height) * FIELD_WIDTH;
			const currentPose = this.data.currentPose;
			if (!currentPose) return;
			const dx = x - currentPose.position[0];
			const dy = y - currentPose.position[1];
			const angle = Math.atan2(dy, dx);
			this.update((state) => ({
				...state,
				targetOrientation: angle
			}));
		};

		const setTargetFacing = (clientX: number, clientY: number) => {
			if (this.paused) return;
			log('setTargetFacing', clientX, clientY);
			const rect = this.target.getBoundingClientRect();
			const x = ((clientX - rect.left) / rect.width) * FIELD_LENGTH;
			const y = ((clientY - rect.top) / rect.height) * FIELD_WIDTH;
			this.update((state) => ({
				...state,
				faceTarget: false,
				targetOrientation: undefined,
				targetFacing: [x, y]
			}));
		};

		const isClickOnRobot = (clientX: number, clientY: number) => {
			if (!this.data.currentPose) return false;

			const rect = this.target.getBoundingClientRect();
			const clickX = ((clientX - rect.left) / rect.width) * FIELD_LENGTH;
			const clickY = ((clientY - rect.top) / rect.height) * FIELD_WIDTH;

			const robotX = this.data.currentPose.position[0];
			const robotY = this.data.currentPose.position[1];

			const distance = Math.hypot(clickX - robotX, clickY - robotY);
			const robotRadius = Math.max(this.robot.data.width, this.robot.data.length) / 2;

			return distance <= robotRadius;
		};

		const handleDoubleClickOrTap = (clientX: number, clientY: number) => {
			if (isClickOnRobot(clientX, clientY)) {
				log('Double tap on robot - clearing targetFacing (like spacebar)');
				this.update((state) => ({
					...state,
					targetFacing: undefined,
					targetPosition: undefined,
					targetOrientation: undefined
				}));
			} else {
				log('Double tap on field - setting targetFacing');
				setTargetFacing(clientX, clientY);
			}
		};

		const onkeydown = (e: KeyboardEvent) => {
			log('onkeydown', e.key);
			switch (e.key) {
				case 'escape':
					this.update((state) => ({
						...state,
						targetPosition: undefined,
						targetOrientation: undefined,
						targetFacing: undefined
					}));
					stop();
					break;
				case ' ':
					this.update((state) => ({
						...state,
						targetFacing: undefined,
						faceTarget: false,
						targetOrientation: undefined
					}));
					break;
			}
		};

		const onmousedown = (e: MouseEvent) => {
			log('onmousedown', e.button);

			if (lastMouseClickTime && performance.now() - lastMouseClickTime < MOUSE_CLICK_THRESHOLD) {
				log('Double-click detected');
				// Double-click detected
				handleDoubleClickOrTap(e.clientX, e.clientY);
				doubleClickTime = performance.now(); // Set double click time
				lastMouseClickTime = 0; // reset
				e.preventDefault();
				if (mouseClickTimeout) {
					clearTimeout(mouseClickTimeout);
					mouseClickTimeout = null;
				}
				return;
			}

			e.preventDefault();
			if (mouseClickTimeout) {
				clearTimeout(mouseClickTimeout);
				mouseClickTimeout = null;
			}

			mouseClickTimeout = setTimeout(() => {
				if (e.button === 0) {
					setTargetPos(e.clientX, e.clientY, true); // Initial click
				} else if (e.button === 2) {
					setTargetOrientation(e.clientX, e.clientY);
				}
			}, MOUSE_CLICK_THRESHOLD);
		};
		const onmousemove = (e: MouseEvent) => {
			log('onmousemove', e.buttons);

			// Check if we're dragging immediately after double click
			if (
				doubleClickTime &&
				performance.now() - doubleClickTime < DOUBLE_CLICK_DRAG_THRESHOLD &&
				e.buttons === 1
			) {
				log('Double click + immediate drag detected - toggling faceTarget');
				this.update((state) => ({
					...state,
					faceTarget: !state.faceTarget
				}));
				doubleClickTime = 0; // Reset to prevent multiple toggles
			}

			if (e.buttons === 1) {
				setTargetPos(e.clientX, e.clientY, false); // Drag, not initial click
			} else if (e.buttons === 2) {
				setTargetOrientation(e.clientX, e.clientY);
			}
		};
		const onmouseup = (e: MouseEvent) => {
			log('onmouseup', e.button);
			e.preventDefault();
			lastMouseClickTime = performance.now();
			// nothing for now
		};

		let lastTouchStartTime = 0;
		let touchstartTimeout: ReturnType<typeof setTimeout> | null = null;
		let lastMouseClickTime = 0;
		let mouseClickTimeout: ReturnType<typeof setTimeout> | null = null;
		let doubleClickTime = 0;
		let doubleTapTime = 0;
		const TOUCH_START_THRESHOLD = 300; // ms
		const MOUSE_CLICK_THRESHOLD = 300; // ms for double click detection
		const DOUBLE_CLICK_DRAG_THRESHOLD = 200; // ms to detect immediate drag after double click

		const ontouchstart = (e: TouchEvent) => {
			log('ontouchstart', e.touches.length);
			if (lastTouchStartTime && performance.now() - lastTouchStartTime < TOUCH_START_THRESHOLD) {
				log('Double-tap detected');
				// Double-tap detected
				const touch = e.touches[0];
				handleDoubleClickOrTap(touch.clientX, touch.clientY);
				doubleTapTime = performance.now(); // Set double tap time
				lastTouchStartTime = 0; // reset
				e.preventDefault();
				if (touchstartTimeout) {
					clearTimeout(touchstartTimeout);
					touchstartTimeout = null;
				}
				return;
			}
			e.preventDefault();
			if (touchstartTimeout) {
				clearTimeout(touchstartTimeout);
				touchstartTimeout = null;
			}
			touchstartTimeout = setTimeout(() => {
				const [touch1, touch2] = e.touches;
				if (touch1) {
					setTargetPos(touch1.clientX, touch1.clientY, true); // Initial touch
				}
				if (touch2) {
					setTargetOrientation(touch2.clientX, touch2.clientY);
				}
			}, TOUCH_START_THRESHOLD);
		};
		const ontouchmove = (e: TouchEvent) => {
			log('ontouchmove', e.touches.length);

			// Check if we're dragging immediately after double tap
			if (doubleTapTime && performance.now() - doubleTapTime < DOUBLE_CLICK_DRAG_THRESHOLD) {
				log('Double tap + immediate drag detected - toggling faceTarget');
				this.update((state) => ({
					...state,
					faceTarget: !state.faceTarget
				}));
				doubleTapTime = 0; // Reset to prevent multiple toggles
			}

			e.preventDefault();
			const [touch1, touch2] = e.touches;
			if (touch1) {
				setTargetPos(touch1.clientX, touch1.clientY, false); // Drag, not initial touch
			}
			if (touch2) {
				setTargetOrientation(touch2.clientX, touch2.clientY);
			}
		};
		const ontouchend = (e: TouchEvent) => {
			log('ontouchend', e.touches.length);
			lastTouchStartTime = performance.now();
			e.preventDefault();
		};

		const oncontextmenu = (e: PointerEvent) => {
			log('oncontextmenu');
			e.preventDefault();
			setTargetOrientation(e.clientX, e.clientY);
		};

		const ondblclick = (e: MouseEvent) => {
			log('ondblclick');
			e.preventDefault();
			setTargetFacing(e.clientX, e.clientY);
		};

		document.addEventListener('keydown', onkeydown);
		this.target.addEventListener('mousedown', onmousedown);
		document.addEventListener('mousemove', onmousemove);
		document.addEventListener('mouseup', onmouseup);

		this.target.addEventListener('touchstart', ontouchstart);
		document.addEventListener('touchmove', ontouchmove);
		document.addEventListener('touchend', ontouchend);

		this.target.addEventListener('contextmenu', oncontextmenu);
		this.target.addEventListener('dblclick', ondblclick);

		let lastTick = performance.now();

		const updatePose = () => {
			if (this.paused) return;
			if (this.data.faceTarget) {
				if (this.data.targetPosition) {
					this.data.targetFacing = this.data.targetPosition;
				}
			}

			const thisTick = performance.now();
			const maxFeetVelocity = this.robot.data.maxVelocity;
			const maxRadVelocity = this.robot.data.maxAngularVelocity * (Math.PI / 180);
			const acceleration = this.robot.data.acceleration;
			const angularAcceleration = this.robot.data.angularAcceleration * (Math.PI / 180);
			const deceleration = this.robot.data.deceleration;
			const angularDeceleration = this.robot.data.angularDeceleration * (Math.PI / 180);

			const dt = (thisTick - lastTick) / 1000;
			lastTick = thisTick;

			// Store previous state
			this.update((state) => ({
				...state,
				prevPose: state.currentPose,
				prevVelocity: state.velocity,
				prevAngularVelocity: state.angularVelocity
			}));

			// Normal target-following logic
			const targetState = this.targetState;
			const currentState = this.currentState;

			if (targetState.position) {
				if (currentState.pose) {
					// Check if this is a new click (not just dragging)
					const hasNewTarget =
						this.data.isInitialClick &&
						this.data.prevTargetPosition &&
						(Math.abs(this.data.prevTargetPosition[0] - targetState.position[0]) > 0.01 ||
							Math.abs(this.data.prevTargetPosition[1] - targetState.position[1]) > 0.01);

					// Reset the initial click flag
					if (this.data.isInitialClick) {
						this.update((state) => ({
							...state,
							isInitialClick: false
						}));
					}

					const [dXFeet, dYFeet] = [
						targetState.position[0] - currentState.pose.position[0],
						targetState.position[1] - currentState.pose.position[1]
					];

					const distanceFeet = Math.hypot(dXFeet, dYFeet);
					const targetDirection = Math.atan2(dYFeet, dXFeet);

					if (distanceFeet > 0.01) {
						// Only move if not at target (with small tolerance)
						const [currentVX, currentVY] = currentState.velocity;
						const currentSpeed = Math.hypot(currentVX, currentVY);
						const currentDirection =
							currentSpeed > 0.01 ? Math.atan2(currentVY, currentVX) : targetDirection;

						let newVX: number, newVY: number;

						if (hasNewTarget && currentSpeed > 0.1) {
							// Target changed while moving - handle direction change with physics
							const directionDiff = targetDirection - currentDirection;
							let normalizedDiff = directionDiff;
							while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
							while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;

							// Calculate how much we need to change velocity vector
							const targetVX = currentSpeed * Math.cos(targetDirection);
							const targetVY = currentSpeed * Math.sin(targetDirection);
							const velocityChangeX = targetVX - currentVX;
							const velocityChangeY = targetVY - currentVY;
							const velocityChangeNeeded = Math.hypot(velocityChangeX, velocityChangeY);

							// Apply deceleration if large direction change needed
							if (Math.abs(normalizedDiff) > Math.PI / 4) {
								// > 45 degree change
								// Decelerate first
								const decelAmount = deceleration * dt;
								const newSpeed = Math.max(0, currentSpeed - decelAmount);

								if (newSpeed > 0.1) {
									// Continue in current direction but slower
									newVX = newSpeed * Math.cos(currentDirection);
									newVY = newSpeed * Math.sin(currentDirection);
								} else {
									// Stopped, now start toward new target
									const accelAmount = acceleration * dt;
									newVX = accelAmount * Math.cos(targetDirection);
									newVY = accelAmount * Math.sin(targetDirection);
								}
							} else {
								// Gradual direction change - apply limited acceleration toward new direction
								const maxVelocityChange = acceleration * dt;
								const changeScale = Math.min(1, maxVelocityChange / velocityChangeNeeded);

								newVX = currentVX + velocityChangeX * changeScale;
								newVY = currentVY + velocityChangeY * changeScale;

								// Ensure we don't exceed max velocity
								const newSpeed = Math.hypot(newVX, newVY);
								if (newSpeed > maxFeetVelocity) {
									const scale = maxFeetVelocity / newSpeed;
									newVX *= scale;
									newVY *= scale;
								}
							}
						} else {
							// Normal trapezoidal velocity profile (no target change or target change from rest)
							// Calculate deceleration distance needed to stop
							const decelDistance = (currentSpeed * currentSpeed) / (2 * deceleration);

							let targetSpeed: number;
							if (distanceFeet <= decelDistance) {
								// Deceleration phase - slow down to stop at target
								targetSpeed = Math.sqrt(2 * deceleration * distanceFeet);
							} else {
								// Acceleration phase - speed up to max velocity or prepare for deceleration
								const timeToDecel = Math.sqrt((2 * distanceFeet) / deceleration);
								const maxSpeedForDistance = deceleration * timeToDecel;
								targetSpeed = Math.min(maxFeetVelocity, maxSpeedForDistance);
							}

							// Apply acceleration/deceleration limits
							const speedDiff = targetSpeed - currentSpeed;
							const maxSpeedChange = (speedDiff > 0 ? acceleration : deceleration) * dt;
							const actualSpeedChange =
								Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), maxSpeedChange);
							const newSpeed = currentSpeed + actualSpeedChange;

							// Calculate new velocity components
							newVX = newSpeed * Math.cos(targetDirection);
							newVY = newSpeed * Math.sin(targetDirection);
						}

						// Update position based on velocity
						const newX = currentState.pose.position[0] + newVX * dt;
						const newY = currentState.pose.position[1] + newVY * dt;

						this.update((state) => ({
							...state,
							velocity: [newVX, newVY],
							currentPose: {
								...state.currentPose!,
								position: [newX, newY]
							}
						}));
					} else {
						// At target position - stop movement
						this.update((state) => ({
							...state,
							velocity: [0, 0],
							currentPose: {
								...state.currentPose!,
								position: targetState.position!
							}
						}));
					}

					// Handle orientation control
					if (targetState.orientation !== undefined && currentState.pose) {
						const currentAngle = currentState.pose.orientation;
						let angleDiff = targetState.orientation - currentAngle;

						// Normalize angle difference to [-π, π]
						while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
						while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

						if (Math.abs(angleDiff) > 0.01) {
							// Only rotate if not at target angle
							const currentAngularSpeed = Math.abs(currentState.angularVelocity);

							// Calculate deceleration angle needed to stop
							const decelAngle =
								(currentAngularSpeed * currentAngularSpeed) / (2 * angularDeceleration);

							let targetAngularSpeed: number;
							if (Math.abs(angleDiff) <= decelAngle) {
								// Deceleration phase
								targetAngularSpeed = Math.sqrt(2 * angularDeceleration * Math.abs(angleDiff));
							} else {
								// Acceleration phase
								const timeToDecel = Math.sqrt((2 * Math.abs(angleDiff)) / angularDeceleration);
								const maxAngularSpeedForAngle = angularDeceleration * timeToDecel;
								targetAngularSpeed = Math.min(maxRadVelocity, maxAngularSpeedForAngle);
							}

							// Apply angular acceleration/deceleration limits
							const angularSpeedDiff = targetAngularSpeed - currentAngularSpeed;
							const maxAngularSpeedChange =
								(angularSpeedDiff > 0 ? angularAcceleration : angularDeceleration) * dt;
							const actualAngularSpeedChange =
								Math.sign(angularSpeedDiff) *
								Math.min(Math.abs(angularSpeedDiff), maxAngularSpeedChange);
							const newAngularSpeed = currentAngularSpeed + actualAngularSpeedChange;

							// Apply direction to angular velocity
							const newAngularVelocity = Math.sign(angleDiff) * newAngularSpeed;

							// Update orientation
							const newOrientation = currentAngle + newAngularVelocity * dt;

							this.update((state) => ({
								...state,
								angularVelocity: newAngularVelocity,
								currentPose: {
									...state.currentPose!,
									orientation: newOrientation
								}
							}));
						} else {
							// At target orientation - stop rotation
							this.update((state) => ({
								...state,
								angularVelocity: 0,
								currentPose: {
									...state.currentPose!,
									orientation: targetState.orientation!
								}
							}));
						}
					}

					// Add current pose to points trail
					const updatedPose = this.currentState.pose!;
					this.points.push({
						position: [updatedPose.position[0], updatedPose.position[1]],
						orientation: updatedPose.orientation
					});
				} else {
					// initial spawn
					this.update((state) => ({
						...state,
						currentPose: {
							position: targetState.position!,
							orientation: targetState.orientation ?? 0
						},
						velocity: [0, 0],
						angularVelocity: 0
					}));

					// Add initial pose to points
					this.points.push({
						position: [targetState.position[0], targetState.position[1]],
						orientation: targetState.orientation ?? 0
					});
				}
			}

			if (currentState.pose) {
				for (const target of this.reachedPositionTargets) {
					const dx = currentState.pose.position[0] - target.point[0];
					const dy = currentState.pose.position[1] - target.point[1];
					const distance = Math.hypot(dx, dy);
					if (distance <= target.threshold) {
						target.resolve();
					}
				}

				for (const target of this.reachedOrientationTargets) {
					let angleDiff = currentState.pose.orientation - target.orientation;
					while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
					while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
					if (Math.abs(angleDiff) <= target.threshold) {
						target.resolve();
					}
				}

				for (const target of this.reachedVelocityTargets) {
					const [velX, velY] = currentState.velocity;
					const speed = Math.hypot(velX, velY);
					if (speed <= target.threshold) {
						target.resolve();
					}
				}
			}
		};

		let doRun = true;
		const run = () => {
			if (!doRun) return;
			updatePose();
			this.draw({
				allPoints: false
			});
			requestAnimationFrame(run);
		};

		requestAnimationFrame(run);

		this.stop = () => {
			this.running = false;
			doRun = false;
			document.removeEventListener('keydown', onkeydown);
			this.target.removeEventListener('mousedown', onmousedown);
			document.removeEventListener('mousemove', onmousemove);
			document.removeEventListener('mouseup', onmouseup);

			this.target.removeEventListener('touchstart', ontouchstart);
			document.removeEventListener('touchmove', ontouchmove);
			document.removeEventListener('touchend', ontouchend);

			this.target.removeEventListener('contextmenu', oncontextmenu);
			this.target.removeEventListener('dblclick', ondblclick);
		};

		return this.stop;
	}

	private paused = false;

	public pause() {
		this.paused = true;
	}

	public resume() {
		this.paused = false;
	}

	stop: () => void = () => {
		throw new Error('Simulator is not running');
	};

	draw(config: { allPoints: boolean }) {
		const pathToDraw = (config.allPoints ? this.points : this.animatedPoints)
			.map((p) => `${p.position[0]},${p.position[1]}`)
			.join(' ');
		this.path.setAttribute('d', `M ${pathToDraw}`);
		this.path.setAttribute('fill', 'none');
		this.path.setAttribute('stroke', 'blue');
		this.path.setAttribute('stroke-width', '0.2');

		const robotPose = this.currentState.pose;
		if (robotPose) {
			const robotX = robotPose.position[0];
			const robotY = robotPose.position[1];
			const robotAngleDeg = robotPose.orientation * (180 / Math.PI);

			this.robotGroup.setAttribute(
				'transform',
				`translate(${robotX}, ${robotY}) rotate(${robotAngleDeg})`
			);

			// Draw robot with bumper similar to index.ts
			const halfWidth = this.robot.data.width / 2;
			const halfLength = this.robot.data.length / 2;
			const chassisWidth = this.robot.data.width * 0.8;
			const chassisLength = this.robot.data.length * 0.8;
			const halfChassisWidth = chassisWidth / 2;
			const halfChassisLength = chassisLength / 2;

			// Arrow size for direction indicator
			const arrowSize = Math.min(this.robot.data.width, this.robot.data.length) * 0.25;
			const arrowTipX = this.robot.data.length * 0.3;
			const arrowBaseX = this.robot.data.length * 0.1;

			this.robotGroup.innerHTML = `
                <rect x="${-halfChassisLength}" y="${-halfChassisWidth}" width="${chassisLength}" height="${chassisWidth}" 
                      fill="#2d3748" stroke="#1a202c" stroke-width="0.02" rx="0.03"/>
                <rect x="${-halfLength}" y="${-halfWidth}" width="${this.robot.data.length}" height="${this.robot.data.width}" 
                      fill="none" stroke="#e53e3e" stroke-width="0.03" rx="0.04"/>
                <polygon points="${arrowTipX},0 ${arrowBaseX},${-arrowSize / 2} ${arrowBaseX},${arrowSize / 2}" 
                         fill="#fbbf24" stroke="#f59e0b" stroke-width="0.01"/>
                <circle cx="0" cy="0" r="${Math.min(this.robot.data.width, this.robot.data.length) * 0.08}" 
                        fill="#60a5fa" stroke="#3b82f6" stroke-width="0.01"/>
            `;
		} else {
			this.robotGroup.innerHTML = '';
		}

		const targetPos = this.data.targetPosition;
		if (targetPos) {
			this.targetCircle.setAttribute('cx', `${targetPos[0]}`);
			this.targetCircle.setAttribute('cy', `${targetPos[1]}`);
			this.targetCircle.setAttribute('r', '0.3');
			this.targetCircle.setAttribute('fill', 'green');
			this.targetCircle.setAttribute('opacity', '0.5');
		} else {
			this.targetCircle.setAttribute('opacity', '0');
		}

		const targetFacing = this.data.targetFacing;
		if (targetFacing) {
			this.targetFacingCircle.setAttribute('cx', `${targetFacing[0]}`);
			this.targetFacingCircle.setAttribute('cy', `${targetFacing[1]}`);
			this.targetFacingCircle.setAttribute('r', '0.3');
			this.targetFacingCircle.setAttribute('fill', 'orange');
			this.targetFacingCircle.setAttribute('opacity', '0.5');
		} else {
			this.targetFacingCircle.setAttribute('opacity', '0');
		}
	}

	drawTrace() {
		if (this.running) throw new Error('Cannot draw trace while simulator is running');
		this.draw({
			allPoints: true
		});
	}

	setConfig(newConfig: Partial<RobotConfig>) {
		this.robot.update((config) => ({
			...config,
			...newConfig
		}));
	}

	clearDraw() {
		this.path.setAttribute('d', '');
		this.robotGroup.innerHTML = '';
		this.targetCircle.setAttribute('opacity', '0');
		this.targetFacingCircle.setAttribute('opacity', '0');
	}

	private readonly reachedPositionTargets: Set<ReachedPositionTarget> = new Set();

	waitUntilPosition(position: Point2D, timeout: number, threshold?: number) {
		return new Promise<void>((resolve, reject) => {
			const reachedTarget: ReachedPositionTarget = {
				point: position,
				threshold: threshold ?? 0.5,
				resolve: () => {
					this.reachedPositionTargets.delete(reachedTarget);
					clearTimeout(t);
					resolve();
				}
			};
			this.reachedPositionTargets.add(reachedTarget);

			const t = setTimeout(() => {
				this.reachedPositionTargets.delete(reachedTarget);
				reject(new Error('Timeout reached before position target was reached'));
			}, timeout);
		});
	}

	private readonly reachedOrientationTargets: Set<ReachedOrientationTarget> = new Set();

	waitUntilOrientation(orientation: number, timeout: number, threshold?: number) {
		return new Promise<void>((resolve, reject) => {
			const reachedTarget: ReachedOrientationTarget = {
				orientation,
				threshold: threshold ?? (5 * Math.PI) / 180,
				resolve: () => {
					this.reachedOrientationTargets.delete(reachedTarget);
					clearTimeout(t);
					resolve();
				}
			};
			this.reachedOrientationTargets.add(reachedTarget);

			const t = setTimeout(() => {
				this.reachedOrientationTargets.delete(reachedTarget);
				reject(new Error('Timeout reached before orientation target was reached'));
			}, timeout);
		});
	}

	private readonly reachedVelocityTargets: Set<ReachedVelocityTarget> = new Set();

	waitUntilVelocity(velocity: number, timeout: number, threshold?: number) {
		return new Promise<void>((resolve, reject) => {
			const reachedTarget: ReachedVelocityTarget = {
				velocity,
				threshold: threshold ?? 0.5,
				resolve: () => {
					this.reachedVelocityTargets.delete(reachedTarget);
					clearTimeout(t);
					resolve();
				}
			};
			this.reachedVelocityTargets.add(reachedTarget);

			const t = setTimeout(() => {
				this.reachedVelocityTargets.delete(reachedTarget);
				reject(new Error('Timeout reached before velocity target was reached'));
			}, timeout);
		});
	}

	waitUntilIdle(timeout: number) {
		return this.waitUntilVelocity(0, timeout, 0.1);
	}
}

type ReachedPositionTarget = {
	point: Point2D;
	threshold: number;
	resolve: () => void;
};

type ReachedOrientationTarget = {
	orientation: number;
	threshold: number;
	resolve: () => void;
};

type ReachedVelocityTarget = {
	velocity: number;
	resolve: () => void;
	threshold: number;
};

export class Robot extends WritableBase<RobotConfig> {}
