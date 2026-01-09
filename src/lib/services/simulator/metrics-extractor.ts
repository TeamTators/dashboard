export class MetricsExtractor {
  extract(traj: Trajectory): TrajectoryMetrics {
    let idleTime = 0
    let maxV = 0
    let maxA = 0

    for (let i = 1; i < traj.samples.length; i++) {
      const a = traj.samples[i - 1]
      const b = traj.samples[i]

      maxV = Math.max(maxV, b.v)

      const dt = b.t - a.t
      if (dt > 0) {
        const acc = (b.v - a.v) / dt
        maxA = Math.max(maxA, Math.abs(acc))
      }

      if (b.waiting) {
        idleTime += dt
      }
    }

    return {
      totalTime: traj.totalTime,
      idleTime,
      maxVelocity: maxV,
      maxAcceleration: maxA
    }
  }
}

export type TrajectoryMetrics = {
  totalTime: number
  idleTime: number
  maxVelocity: number
  maxAcceleration: number
}
