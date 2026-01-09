export type Vec2 = { x: number; y: number }


export type Pose2D = {
  position: Vec2
  heading?: number
}


export interface Path {
  length: number

  sample(s: number): {
    position: Vec2
    tangent?: number
    curvature?: number
  }

  project(p: Vec2): number
}

export type MotionLimits = {
  vMax: number
  aMax: number
  dMax: number
  wMax: number
  alphaMax: number
}

export type StateType = 'DO_BY' | 'DO_HERE';

export type StateConstraint = {
  id: string
  s: number
  type: StateType
  duration: number
  limits: MotionLimits
  requiredHeading?: number
};