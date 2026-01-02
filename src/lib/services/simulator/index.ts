import { WritableBase } from "$lib/utils/writables";
import { Color } from "colors/color";
import type { Point2D } from "math/point";

export type SimulatorConfig = Readonly<{
    maxVelocity: number; // ft/s
    acceleration: number; // ft/s²
    deceleration: number; // ft/s²
    year: number;

    // robot dimensions
    width: number;
    height: number;
    spinSpeed: number; // deg/s
    spinAcceleration: number; // deg/s²
    rotationSensitivity: number; // multiplier for finger rotation sensitivity
}>;

export class Simulator extends WritableBase<SimulatorConfig> {
    constructor(public readonly config: SimulatorConfig) {
        super(config);
    }

    targetPos: Point2D | undefined = undefined;
    currentPos: Point2D | undefined = undefined;
    currentVelocity: number = 0;
    currentAngle: number = 0; // radians
    targetAngle: number = 0; // radians - target angle for two-finger rotation
    currentSpinVelocity: number = 0; // radians/frame
    
    isShiftPressed: boolean = false;
    activePointers: Set<number> = new Set();
    isLeftArrowPressed: boolean = false;
    isRightArrowPressed: boolean = false;
    
    animationId: number | undefined = undefined;
    lastTime: number = 0;

    target: HTMLDivElement | undefined = undefined;
    points: Point2D[] = [];

    init(target: HTMLDivElement) {
        if (this.target) throw new Error('KickoffTraceApp already initialized');
        this.target = target;

        const img = document.createElement('img');
        img.src = `/assets/field/${this.config.year}.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        this.target.appendChild(img);

        this.target.style.width = '100%';
        this.target.style.aspectRatio = '2 / 1';
        this.target.style.position = 'relative';
        this.target.style.overflow = 'hidden';
    }

    clear() {
        this.target?.querySelectorAll('*').forEach(i => {
            if (i.tagName === 'IMG') return;
            i.remove();
        });
    }

    setConfig(config: Partial<SimulatorConfig>) {
        Object.assign(this.config, config);
        this.set(this.config);
    }

    start() {
        const FIELD_WIDTH = 54; // feet
        const FIELD_LENGTH = 27; // feet
        
        
        const setPos = (clientX: number, clientY: number) => {
            const rect = this.target?.getBoundingClientRect();
            if (!rect) return;
            
            const xPixels = clientX - rect.left;
            const yPixels = clientY - rect.top;
            
            const xFeet = (xPixels / rect.width) * FIELD_WIDTH;
            const yFeet = (yPixels / rect.height) * FIELD_LENGTH;
            
            this.targetPos = [
                Math.max(0, Math.min(FIELD_WIDTH, xFeet)), 
                Math.max(0, Math.min(FIELD_LENGTH, yFeet))
            ];
        }
        
        const mouseDown = (e: MouseEvent) => {
            e.preventDefault();
            this.activePointers.add(0); // Use 0 as mouse pointer ID
            setPos(e.clientX, e.clientY);
        }
        const mouseMove = (e: MouseEvent) => {
            e.preventDefault();
            if (this.activePointers.has(0)) {
                setPos(e.clientX, e.clientY);
            }
        }
        const mouseUp = (e: MouseEvent) => {
            e.preventDefault();
            this.activePointers.delete(0);
            setPos(e.clientX, e.clientY);
        }
        const mouseLeave = (e: MouseEvent) => {
            e.preventDefault();
            this.activePointers.delete(0);
        }
        
        // Touch event handlers
        const touchStart = (e: TouchEvent) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                this.activePointers.add(touch.identifier);
            }
            
            // First touch controls position
            if (e.touches.length >= 1) {
                setPos(e.touches[0].clientX, e.touches[0].clientY);
            }
            
            // Second touch sets facing direction
            if (e.touches.length >= 2 && this.currentPos) {
                const rect = this.target?.getBoundingClientRect();
                if (rect) {
                    const touch = e.touches[1];
                    const xPixels = touch.clientX - rect.left;
                    const yPixels = touch.clientY - rect.top;
                    const xFeet = (xPixels / rect.width) * FIELD_WIDTH;
                    const yFeet = (yPixels / rect.height) * FIELD_LENGTH;
                    
                    // Calculate angle from robot position to tap point
                    const dx = xFeet - this.currentPos[0];
                    const dy = yFeet - this.currentPos[1];
                    this.targetAngle = Math.atan2(dy, dx);
                }
            }
        }
        const touchMove = (e: TouchEvent) => {
            e.preventDefault();
            
            // First touch controls position
            if (e.touches.length >= 1) {
                setPos(e.touches[0].clientX, e.touches[0].clientY);
            }
            
            // Second touch updates facing direction
            if (e.touches.length >= 2 && this.currentPos) {
                const rect = this.target?.getBoundingClientRect();
                if (rect) {
                    const touch = e.touches[1];
                    const xPixels = touch.clientX - rect.left;
                    const yPixels = touch.clientY - rect.top;
                    const xFeet = (xPixels / rect.width) * FIELD_WIDTH;
                    const yFeet = (yPixels / rect.height) * FIELD_LENGTH;
                    
                    // Calculate angle from robot position to tap point
                    const dx = xFeet - this.currentPos[0];
                    const dy = yFeet - this.currentPos[1];
                    this.targetAngle = Math.atan2(dy, dx);
                }
            }
        }
        const touchEnd = (e: TouchEvent) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                this.activePointers.delete(touch.identifier);
            }
        }
        
        const keyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                this.isShiftPressed = true;
            } else if (e.key === 'ArrowLeft') {
                this.isLeftArrowPressed = true;
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.isRightArrowPressed = true;
                e.preventDefault();
            }
        }
        const keyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                this.isShiftPressed = false;
            } else if (e.key === 'ArrowLeft') {
                this.isLeftArrowPressed = false;
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.isRightArrowPressed = false;
                e.preventDefault();
            }
        }

        this.target?.addEventListener('mousedown', mouseDown);
        this.target?.addEventListener('mousemove', mouseMove);
        this.target?.addEventListener('mouseup', mouseUp);
        this.target?.addEventListener('mouseleave', mouseLeave);
        this.target?.addEventListener('touchstart', touchStart);
        this.target?.addEventListener('touchmove', touchMove);
        this.target?.addEventListener('touchend', touchEnd);
        this.target?.addEventListener('touchcancel', touchEnd);
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        
        // Make target focusable to ensure it can receive keyboard events
        this.target!.tabIndex = 0;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        this.target?.appendChild(svg);

        const targetCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        targetCircle.setAttribute("r", "5");
        targetCircle.setAttribute("fill", Color.fromBootstrap('primary').toString('rgb'));
        svg.appendChild(targetCircle);

        // Robot group for easy positioning and rotation
        const robotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        svg.appendChild(robotGroup);
        
        // Robot chassis (main body)
        const robotChassis = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        robotChassis.setAttribute("fill", "#2d3748");
        robotChassis.setAttribute("stroke", "#1a202c");
        robotChassis.setAttribute("stroke-width", "2");
        robotChassis.setAttribute("rx", "3");
        robotGroup.appendChild(robotChassis);

        // Robot bumper (perimeter around chassis)
        const robotBumper = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        robotBumper.setAttribute("fill", "none");
        robotBumper.setAttribute("stroke", "#e53e3e");
        robotBumper.setAttribute("stroke-width", "3");
        robotBumper.setAttribute("rx", "4");
        robotGroup.appendChild(robotBumper);

        // Direction indicator arrow
        const directionArrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        directionArrow.setAttribute("fill", "#fbbf24");
        directionArrow.setAttribute("stroke", "#f59e0b");
        directionArrow.setAttribute("stroke-width", "1");
        robotGroup.appendChild(directionArrow);
        
        // Robot center dot
        const centerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        centerDot.setAttribute("fill", "#60a5fa");
        centerDot.setAttribute("stroke", "#3b82f6");
        centerDot.setAttribute("stroke-width", "1");
        robotGroup.appendChild(centerDot);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", Color.fromBootstrap('danger').toString('rgb'));
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);


        const animate = (currentTime: number) => {
            const maxVelocity = this.config.maxVelocity; // ft/s
            const acceleration = this.config.acceleration; // ft/s²
            const maxSpinVelocity = (this.config.spinSpeed * Math.PI / 180); // rad/s
            const spinAcceleration = (this.config.spinAcceleration * Math.PI / 180); // rad/s²

            if (this.lastTime === 0) this.lastTime = currentTime;
            const deltaTime = (currentTime - this.lastTime) / 1000; // Convert ms to seconds
            this.lastTime = currentTime;
            
            // Skip frame if delta time is too large (e.g., tab was inactive)
            if (deltaTime > 0.1) {
                this.animationId = requestAnimationFrame(animate);
                return;
            }
            
            // all calcs here are in feet and seconds, not frames or pixels
            if (this.targetPos && this.currentPos) {
                const dx = this.targetPos[0] - this.currentPos[0];
                const dy = this.targetPos[1] - this.currentPos[1];
                const distance = Math.sqrt(dx * dx + dy * dy);

                const targetAngle = Math.atan2(dy, dx);

                const stopThreshold = 0.1;
                
                if (distance > stopThreshold) {
                    // Trapezoidal velocity control - calculate deceleration distance
                    const decelerationDistance = (this.currentVelocity * this.currentVelocity) / (2 * this.config.deceleration);
                    
                    if (distance > decelerationDistance) {
                        // Acceleration phase - accelerate towards target
                        this.currentVelocity += acceleration * deltaTime;
                        if (this.currentVelocity > maxVelocity) {
                            this.currentVelocity = maxVelocity;
                        }
                    } else {
                        // Deceleration phase - slow down to stop smoothly at target
                        const targetVelocity = Math.sqrt(2 * this.config.deceleration * distance);
                        if (this.currentVelocity > targetVelocity) {
                            this.currentVelocity -= this.config.deceleration * deltaTime;
                            // Don't let velocity go negative
                            if (this.currentVelocity < 0) {
                                this.currentVelocity = 0;
                            }
                        }
                    }

                    // Check for manual rotation with arrow keys
                    const manualRotation = this.isLeftArrowPressed || this.isRightArrowPressed;
                    // Check if using tap-based rotation (second finger touching)
                    const tapRotation = this.activePointers.size >= 2;
                    // Check if spinning should be prevented (no shift, tap rotation, or more than 2 touches)
                    const preventSpinning = !this.isShiftPressed || tapRotation || this.activePointers.size > 2;
                    
                    if (manualRotation) {
                        // Manual rotation with arrow keys (time-based)
                        let desiredSpinDirection = 0;
                        if (this.isRightArrowPressed) desiredSpinDirection += 1; // clockwise
                        if (this.isLeftArrowPressed) desiredSpinDirection -= 1; // counterclockwise
                        
                        const targetSpinVelocity = desiredSpinDirection * maxSpinVelocity;
                        
                        // Apply spin acceleration towards target velocity (time-based)
                        const spinDiff = targetSpinVelocity - this.currentSpinVelocity;
                        const maxSpinChange = spinAcceleration * deltaTime;
                        
                        if (Math.abs(spinDiff) > maxSpinChange) {
                            this.currentSpinVelocity += Math.sign(spinDiff) * maxSpinChange;
                        } else {
                            this.currentSpinVelocity = targetSpinVelocity;
                        }
                        
                        // Apply spin velocity to angle (time-based)
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                    } else if (tapRotation) {
                        // Tap-based rotation - rotate towards targetAngle using spin velocity
                        let angleDiff = this.targetAngle - this.currentAngle;
                        
                        // Normalize angle difference to [-π, π]
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        
                        // Calculate desired spin direction and accelerate spin velocity
                        const desiredSpinDirection = Math.sign(angleDiff);
                        const targetSpinVelocity = desiredSpinDirection * maxSpinVelocity;
                        
                        // Apply spin acceleration towards target velocity
                        const spinDiff = targetSpinVelocity - this.currentSpinVelocity;
                        const maxSpinChange = spinAcceleration * deltaTime;
                        
                        if (Math.abs(spinDiff) > maxSpinChange) {
                            this.currentSpinVelocity += Math.sign(spinDiff) * maxSpinChange;
                        } else {
                            this.currentSpinVelocity = targetSpinVelocity;
                        }
                        
                        // Apply spin velocity to angle
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                        
                        // Stop spinning if we're close enough to target angle
                        if (Math.abs(angleDiff) < 0.1) { // ~6 degrees
                            this.currentSpinVelocity = 0;
                            this.currentAngle = this.targetAngle;
                        }
                    } else if (!preventSpinning) {
                        // Shift pressed - rotate towards movement direction
                        let angleDiff = targetAngle - this.currentAngle;
                        
                        // Normalize angle difference to [-π, π]
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        
                        // Calculate desired spin direction and accelerate spin velocity (time-based)
                        const desiredSpinDirection = Math.sign(angleDiff);
                        const targetSpinVelocity = desiredSpinDirection * maxSpinVelocity;
                        
                        // Apply spin acceleration towards target velocity (time-based)
                        const spinDiff = targetSpinVelocity - this.currentSpinVelocity;
                        const maxSpinChange = spinAcceleration * deltaTime;
                        
                        if (Math.abs(spinDiff) > maxSpinChange) {
                            this.currentSpinVelocity += Math.sign(spinDiff) * maxSpinChange;
                        } else {
                            this.currentSpinVelocity = targetSpinVelocity;
                        }
                        
                        // Cap spin velocity to maximum
                        if (Math.abs(this.currentSpinVelocity) > maxSpinVelocity) {
                            this.currentSpinVelocity = Math.sign(this.currentSpinVelocity) * maxSpinVelocity;
                        }
                        
                        // Apply spin velocity to angle (time-based)
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                        
                        // Stop spinning if we're close enough to target angle
                        if (Math.abs(angleDiff) < 0.05) { // ~3 degrees
                            this.currentSpinVelocity = 0;
                            this.currentAngle = targetAngle;
                        }
                    } else if (preventSpinning || (!this.isLeftArrowPressed && !this.isRightArrowPressed)) {
                        // Spinning is prevented or no manual input - gradually stop any existing spin
                        if (Math.abs(this.currentSpinVelocity) > spinAcceleration * deltaTime) {
                            this.currentSpinVelocity -= Math.sign(this.currentSpinVelocity) * spinAcceleration * deltaTime;
                        } else {
                            this.currentSpinVelocity = 0;
                        }
                        // Still apply remaining spin velocity (time-based)
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                    }

                    const moveX = (dx / distance) * this.currentVelocity * deltaTime;
                    const moveY = (dy / distance) * this.currentVelocity * deltaTime;

                    this.currentPos[0] += moveX;
                    this.currentPos[1] += moveY;
                } else {
                    // Reached target
                    this.currentVelocity = 0;
                    
                    // Check for manual rotation with arrow keys or tap rotation even when stationary
                    const tapRotation = this.activePointers.size >= 2;
                    
                    if (this.isLeftArrowPressed || this.isRightArrowPressed) {
                        let desiredSpinDirection = 0;
                        if (this.isRightArrowPressed) desiredSpinDirection += 1; // clockwise
                        if (this.isLeftArrowPressed) desiredSpinDirection -= 1; // counterclockwise
                        
                        const targetSpinVelocity = desiredSpinDirection * maxSpinVelocity;
                        
                        // Apply spin acceleration towards target velocity (time-based)
                        const spinDiff = targetSpinVelocity - this.currentSpinVelocity;
                        const maxSpinChange = spinAcceleration * deltaTime;
                        
                        if (Math.abs(spinDiff) > maxSpinChange) {
                            this.currentSpinVelocity += Math.sign(spinDiff) * maxSpinChange;
                        } else {
                            this.currentSpinVelocity = targetSpinVelocity;
                        }
                        
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                    } else if (tapRotation) {
                        // Tap rotation when stationary - rotate towards targetAngle
                        let angleDiff = this.targetAngle - this.currentAngle;
                        
                        // Normalize angle difference to [-π, π]
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        
                        // Calculate desired spin direction and accelerate spin velocity
                        const desiredSpinDirection = Math.sign(angleDiff);
                        const targetSpinVelocity = desiredSpinDirection * maxSpinVelocity;
                        
                        // Apply spin acceleration towards target velocity
                        const spinDiff = targetSpinVelocity - this.currentSpinVelocity;
                        const maxSpinChange = spinAcceleration * deltaTime;
                        
                        if (Math.abs(spinDiff) > maxSpinChange) {
                            this.currentSpinVelocity += Math.sign(spinDiff) * maxSpinChange;
                        } else {
                            this.currentSpinVelocity = targetSpinVelocity;
                        }
                        
                        // Apply spin velocity to angle
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                        
                        // Stop spinning if we're close enough to target angle
                        if (Math.abs(angleDiff) < 0.1) { // ~6 degrees
                            this.currentSpinVelocity = 0;
                            this.currentAngle = this.targetAngle;
                        }
                    } else {
                        // Gradually stop spinning when no input (time-based)
                        const maxSpinChange = spinAcceleration * deltaTime;
                        if (Math.abs(this.currentSpinVelocity) > maxSpinChange) {
                            this.currentSpinVelocity -= Math.sign(this.currentSpinVelocity) * maxSpinChange;
                        } else {
                            this.currentSpinVelocity = 0;
                        }
                        // Apply remaining spin velocity (time-based)
                        this.currentAngle += this.currentSpinVelocity * deltaTime;
                    }
                }
            }

            if (!this.currentPos && this.targetPos) {
                this.currentPos = [...this.targetPos];
            }

            if (this.currentPos) this.points.push([...this.currentPos]);
            if (this.points.length > 180) {
                this.points.shift();
            }

            const rect = this.target?.getBoundingClientRect();
            if (!rect) {
                this.animationId = requestAnimationFrame(animate);
                return;
            }
            
            const feetToPixelX = (feet: number) => (feet / FIELD_WIDTH) * rect.width;
            const feetToPixelY = (feet: number) => (feet / FIELD_LENGTH) * rect.height;
            
            path.setAttribute("d", this.points.map((p, i) => {
                const x = feetToPixelX(p[0]);
                const y = feetToPixelY(p[1]);
                return (i === 0 ? 'M' : 'L') + x + ' ' + y;
            }).join(' '));

            if (this.currentPos) {
                const currentX = feetToPixelX(this.currentPos[0]);
                const currentY = feetToPixelY(this.currentPos[1]);
                const robotWidth = feetToPixelX(this.config.width);
                const robotHeight = feetToPixelY(this.config.height);
                
                robotGroup.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${this.currentAngle}rad)`;
                robotGroup.style.transformOrigin = '0 0';

                robotChassis.setAttribute("width", (robotWidth * 0.8).toString());
                robotChassis.setAttribute("height", (robotHeight * 0.8).toString());
                robotChassis.setAttribute("x", (-robotWidth * 0.4).toString());
                robotChassis.setAttribute("y", (-robotHeight * 0.4).toString());
                
                // Bumper around the perimeter
                robotBumper.setAttribute("width", robotWidth.toString());
                robotBumper.setAttribute("height", robotHeight.toString());
                robotBumper.setAttribute("x", (-robotWidth / 2).toString());
                robotBumper.setAttribute("y", (-robotHeight / 2).toString());
                
                const arrowSize = Math.min(robotWidth, robotHeight) * 0.25;
                const arrowPoints = [
                    `${robotWidth * 0.3},0`, // tip
                    `${robotWidth * 0.1},${-arrowSize/2}`, // top base
                    `${robotWidth * 0.1},${arrowSize/2}`  // bottom base
                ].join(' ');
                directionArrow.setAttribute("points", arrowPoints);
                centerDot.setAttribute("cx", "0");
                centerDot.setAttribute("cy", "0");
                centerDot.setAttribute("r", String(Math.min(robotWidth, robotHeight) * 0.08));
            }

            if (this.targetPos) {
                const targetX = feetToPixelX(this.targetPos[0]);
                const targetY = feetToPixelY(this.targetPos[1]);
                targetCircle.setAttribute("cx", targetX.toString());
                targetCircle.setAttribute("cy", targetY.toString());
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);

        return () => {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = undefined;
            }
            this.target?.removeEventListener('mousedown', mouseDown);
            this.target?.removeEventListener('mousemove', mouseMove);
            this.target?.removeEventListener('mouseup', mouseUp);
            this.target?.removeEventListener('mouseleave', mouseLeave);
            this.target?.removeEventListener('touchstart', touchStart);
            this.target?.removeEventListener('touchmove', touchMove);
            this.target?.removeEventListener('touchend', touchEnd);
            this.target?.removeEventListener('touchcancel', touchEnd);
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
        }
    }
}