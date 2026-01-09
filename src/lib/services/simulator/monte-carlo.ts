class MonteCarloRunner {
  run(
    base: AnnotatedPath,
    limits: MotionLimits,
    iterations: number
  ): Trajectory[] {
    const results: Trajectory[] = []

    for (let i = 0; i < iterations; i++) {
      const perturbed = this.perturb(base)
      results.push(
        new TrajectoryPlanner().plan(
          perturbed,
          limits
        )
      )
    }

    return results
  }

  private perturb(
    base: AnnotatedPath
  ): AnnotatedPath {
    return {
      path: base.path,
      states: base.states.map(st => ({
        ...st,
        s: st.s + randomNormal(0, 0.02),
        duration: st.duration * randomNormal(1, 0.1)
      }))
    }
  }
}
