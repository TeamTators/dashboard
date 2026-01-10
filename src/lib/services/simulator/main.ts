export type Vec2 = {
  x: number
  y: number
}

export type Pose2D = {
  position: Vec2
  heading?: number
}

export type MotionLimits = {
  vMax: number
  aMax: number
  dMax: number
  wMax: number
  alphaMax: number
}

export type StateType = 'DO_BY' | 'DO_HERE'

export type StateConstraint = {
  id: string
  s: number
  type: StateType
  duration: number
  limits: MotionLimits
  requiredHeading?: number
}

export interface Path {
  readonly length: number

  sample(s: number): {
    position: Vec2
    tangent?: number
    curvature?: number
  }

  project(p: Vec2): number
}

export type AnnotatedPath = {
  path: Path
  states: StateConstraint[]
}

export type VelocitySample = {
  s: number
  v: number
}

export type VelocityProfile = {
  samples: VelocitySample[]
}

export class PathSegmenter {
  segment(
    path: Path,
    states: StateConstraint[]
  ): number[] {
    const points = new Set<number>()

    points.add(0)
    points.add(path.length)

    for (const state of states) {
      points.add(state.s)
    }

    return Array.from(points).sort((a, b) => a - b)
  }
}

export class ForwardPlanner {
  compute(
    breakpoints: number[],
    limits: MotionLimits
  ): VelocityProfile {
    const samples: VelocitySample[] = []

    let v = 0

    for (let i = 0; i < breakpoints.length; i++) {
      const s = breakpoints[i]

      if (i > 0) {
        const ds = s - breakpoints[i - 1]
        const vMaxAccel = Math.sqrt(
          v * v + 2 * limits.aMax * ds
        )
        v = Math.min(vMaxAccel, limits.vMax)
      }

      samples.push({ s, v })
    }

    return { samples }
  }
}

export class BackwardPlanner {
  compute(
    breakpoints: number[],
    states: StateConstraint[],
    path: Path
  ): VelocityProfile {
    const samples: VelocitySample[] = new Array(breakpoints.length)

    let v = 0

    const stopPoints = new Set<number>([path.length])
    const timeConstraints: TimeConstraint[] = []

    for (const state of states) {
      if (state.type === 'DO_HERE') {
        stopPoints.add(state.s)
      }

      if (state.type === 'DO_BY') {
        timeConstraints.push({
          sEnd: state.s,
          duration: state.duration
        })
      }
    }

    for (let i = breakpoints.length - 1; i >= 0; i--) {
      const s = breakpoints[i]

      if (stopPoints.has(s)) {
        v = 0
      }

      let vLimit = Infinity

      for (const tc of timeConstraints) {
        if (s < tc.sEnd) {
          const ds = tc.sEnd - s
          const vTime = ds / tc.duration
          vLimit = Math.min(vLimit, vTime)
        }
      }

      if (i < breakpoints.length - 1) {
        const ds = breakpoints[i + 1] - s
        const dMax = this.getDecelLimit(s, states)
        const vDecel = Math.sqrt(v * v + 2 * dMax * ds)
        v = Math.min(vDecel, vLimit)
      } else {
        v = vLimit
      }

      samples[i] = { s, v }
    }

    return { samples }
  }

  private getDecelLimit(
    s: number,
    states: StateConstraint[]
  ): number {
    const next =
      states
        .filter(st => st.s >= s)
        .sort((a, b) => a.s - b.s)[0]

    return next?.limits.dMax ?? Infinity
  }
}


export class VelocityProfileMerger {
  merge(
    a: VelocityProfile,
    b: VelocityProfile
  ): VelocityProfile {
    const samples = a.samples.map((sa, i) => ({
      s: sa.s,
      v: Math.min(sa.v, b.samples[i].v)
    }))

    return { samples }
  }
}

export type TrajectorySample = {
  t: number
  s: number
  v: number
  pose: Pose2D
  stateId?: string
  waiting?: boolean
}


export type Trajectory = {
  totalTime: number
  samples: TrajectorySample[]
  violations: TrajectoryViolation[]
}


export class TrajectoryIntegrator {
  integrate(
    profile: VelocityProfile,
    path: Path,
    states: StateConstraint[]
  ): Trajectory {
    const samples: TrajectorySample[] = []
    const violations: TrajectoryViolation[] = []

    let t = 0
    let stateIndex = 0
    const visitedStates = new Set<string>()

    for (let i = 0; i < profile.samples.length - 1; i++) {
      const a = profile.samples[i]
      const b = profile.samples[i + 1]

      const ds = b.s - a.s
      const v = Math.max(a.v, 1e-6)
      const dt = ds / v

      t += dt

      // Check physics violations - velocity limits
      if (b.v > a.v) {
        const acceleration = (b.v - a.v) / dt
        const state = states.find(st => st.s <= b.s && (states.indexOf(st) === states.length - 1 || states[states.indexOf(st) + 1].s > b.s))
        const maxAccel = state?.limits.aMax ?? Number.MAX_VALUE
        if (acceleration > maxAccel + 1e-6) {
          violations.push({
            type: 'PHYSICS_LIMIT',
            s: b.s
          })
        }
      }

      // Check deceleration limits
      if (b.v < a.v) {
        const deceleration = Math.abs((b.v - a.v) / dt)
        const state = states.find(st => st.s <= b.s && (states.indexOf(st) === states.length - 1 || states[states.indexOf(st) + 1].s > b.s))
        const maxDecel = state?.limits.dMax ?? Number.MAX_VALUE
        if (deceleration > maxDecel + 1e-6) {
          violations.push({
            type: 'PHYSICS_LIMIT',
            s: b.s
          })
        }
      }

      while (
        stateIndex < states.length &&
        states[stateIndex].s <= b.s
      ) {
        const st = states[stateIndex]
        visitedStates.add(st.id)

        if (st.type === 'DO_HERE') {
          const pathSample = path.sample(st.s)
          const pose: Pose2D = {
            position: pathSample.position,
            heading: pathSample.tangent
          }
          
          // Check orientation constraint
          if (st.requiredHeading !== undefined && pathSample.tangent !== undefined) {
            const orientationConstraint = {
              s: st.s,
              heading: st.requiredHeading,
              type: st.type
            }
            
            if (!this.enforceOrientation(pose, orientationConstraint)) {
              violations.push({
                type: 'ORIENTATION_MISSED',
                stateId: st.id
              })
            }
          }

          samples.push({
            t,
            s: st.s,
            v: 0,
            pose,
            stateId: st.id,
            waiting: true
          })

          t += st.duration
        }

        stateIndex++
      }

      samples.push({
        t,
        s: b.s,
        v: b.v,
        pose: {
          position: path.sample(b.s).position,
          heading: path.sample(b.s).tangent
        }
      })
    }

    // Check for missed states
    for (const state of states) {
      if (!visitedStates.has(state.id)) {
        violations.push({
          type: 'STATE_MISSED',
          stateId: state.id
        })
      }
    }

    return {
      totalTime: t,
      samples,
      violations
    }
  }

  private enforceOrientation(
  pose: Pose2D,
  constraint?: OrientationConstraint
): boolean {
  if (!constraint?.heading || pose.heading === undefined) {
    return true
  }

  const err =
    Math.abs(
      Math.atan2(
        Math.sin(pose.heading - constraint.heading),
        Math.cos(pose.heading - constraint.heading)
      )
    )

  return err < 0.05
}

}



export class TrajectoryPlanner {
  constructor(
    private segmenter = new PathSegmenter(),
    private forward = new ForwardPlanner(),
    private backward = new BackwardPlanner(),
    private integrator = new TrajectoryIntegrator(),
    private merger = new VelocityProfileMerger()
  ) {}

  plan(
    input: AnnotatedPath,
    baseLimits: MotionLimits
  ): Trajectory {
    const breakpoints =
      this.segmenter.segment(
        input.path,
        input.states
      )

    const vF =
      this.forward.compute(
        breakpoints,
        baseLimits
      )

    const vB =
      this.backward.compute(
        breakpoints,
        input.states,
        input.path
      )

    const profile =
      this.merger.merge(vF, vB)

    return this.integrator.integrate(
      profile,
      input.path,
      input.states
    )
  }
}

type TimeConstraint = {
  sEnd: number
  duration: number
}


type OrientationConstraint = {
  s: number
  heading: number
  type: StateType
}

export type TrajectoryViolation =
  | { type: 'STATE_MISSED'; stateId: string }
  | { type: 'ORIENTATION_MISSED'; stateId: string }
  | { type: 'PHYSICS_LIMIT'; s: number }

  export type TrajectoryMetrics = {
  totalTime: number
  idleTime: number
  maxVelocity: number
  maxAcceleration: number
}

