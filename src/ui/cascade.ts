import type { PlanResult } from '../engine'
import type { PlanData } from '../engine/types'
import { strings } from '../strings'
import { PLAN_LINES } from './strataGraph'

export type CascadeLevel =
  'lever' | 'shift' | 'objective' | 'initiative' | 'project' | 'line' | 'kpi' | 'plan'
export type CascadeNode = { level: CascadeLevel; id: string; label: string }

const planLineLabel = (id: string) => strings.direction.lines[id] ?? id

/**
 * The chain an Explain key sits in, from lever to KPI, read from the data and the plan.
 * Returns an empty list when the key is not part of the cascade.
 */
export function cascadeFor(key: string, data: PlanData, plan: PlanResult): CascadeNode[] {
  const [head, ...rest] = key.split('.')
  const id = rest.join('.')
  const inits = data.initiatives.initiatives
  const objectives = data.objectives.objectives
  const shifts = data.objectives.shifts
  const kpis = data.objectives.scorecard.kpis
  const shiftNode = (sid: string): CascadeNode => ({
    level: 'shift',
    id: sid,
    label: shifts.find((s) => s.id === sid)?.name ?? sid,
  })
  const objectiveNode = (oid: string): CascadeNode => ({
    level: 'objective',
    id: oid,
    label: objectives.find((o) => o.id === oid)?.name ?? oid,
  })
  const initNode = (iid: string): CascadeNode => ({
    level: 'initiative',
    id: iid,
    label: inits.find((i) => i.id === iid)?.name ?? iid,
  })
  const kpiNode = (kid: string): CascadeNode => ({
    level: 'kpi',
    id: kid,
    label: kpis.find((k) => k.id === kid)?.name ?? kid,
  })
  const leverNodes = (ids: string[]): CascadeNode[] =>
    [...new Set(ids)].map((l) => ({ level: 'lever', id: l, label: strings.levers.short[l] ?? l }))
  const planNode = (pid: string): CascadeNode => ({
    level: 'plan',
    id: pid,
    label: strings.plans.names[pid] ?? pid,
  })

  const chainFromInitiative = (init: (typeof inits)[number]): CascadeNode[] => {
    const objective = objectives.find((o) => o.id === init.objectives[0])
    const shift = objective ? shifts.find((s) => s.id === objective.shift) : undefined
    const levers = shift ? shift.levers : init.rules.map((r) => r.leverId)
    const kpi = init.kpis.find((k) => kpis.some((x) => x.id === k))
    return [
      ...leverNodes(levers),
      ...(shift ? [shiftNode(shift.id)] : []),
      ...(objective ? [objectiveNode(objective.id)] : []),
      initNode(init.id),
      {
        level: 'project',
        id: init.projects[0]?.id ?? '',
        label: init.projects.map((p) => p.name).join(', '),
      },
      planNode(init.plan),
      ...(kpi ? [kpiNode(kpi)] : []),
    ]
  }

  switch (head) {
    case 'initiative':
    case 'roadmap': {
      const init = inits.find((i) => i.id === id)
      return init ? chainFromInitiative(init) : []
    }
    case 'project': {
      const init = inits.find((i) => i.projects.some((p) => p.id === id))
      if (!init) return []
      const chain = chainFromInitiative(init)
      const p = init.projects.find((x) => x.id === id)!
      return chain.map((n) =>
        n.level === 'project' ? { level: 'project', id: p.id, label: p.name } : n,
      )
    }
    case 'objective': {
      const o = objectives.find((x) => x.id === id)
      if (!o) return []
      const shift = shifts.find((s) => s.id === o.shift)
      const feeding = inits.filter((i) => i.objectives.includes(o.id))
      return [
        ...leverNodes(shift?.levers ?? []),
        ...(shift ? [shiftNode(shift.id)] : []),
        objectiveNode(o.id),
        {
          level: 'initiative',
          id: feeding[0]?.id ?? '',
          label: feeding.map((i) => i.name).join(', '),
        },
        kpiNode(o.target.metric),
      ]
    }
    case 'kpi': {
      const k = kpis.find((x) => x.id === id)
      if (!k) return []
      const owners = objectives.filter((o) => o.target.metric === k.id)
      const o = owners[0]
      const shift = o ? shifts.find((s) => s.id === o.shift) : undefined
      const levers = k.computedFrom?.startsWith('levers.')
        ? [k.computedFrom.slice(7)]
        : (shift?.levers ?? [])
      return [
        ...leverNodes(levers),
        ...(shift ? [shiftNode(shift.id)] : []),
        ...(o ? [objectiveNode(o.id)] : []),
        kpiNode(k.id),
      ]
    }
    case 'plan': {
      const members = inits.filter((i) => i.plan === id)
      const objectiveIds = [...new Set(members.flatMap((i) => i.objectives))]
      return [
        {
          level: 'objective',
          id: objectiveIds[0] ?? '',
          label: objectiveIds
            .map((oid) => objectives.find((x) => x.id === oid)?.name ?? oid)
            .join(', '),
        },
        {
          level: 'initiative',
          id: members[0]?.id ?? '',
          label: members.map((i) => i.name).join(', '),
        },
        planNode(id),
      ]
    }
    case 'financials': {
      if (!(PLAN_LINES as readonly string[]).includes(id) && id !== 'ebitdaMargin') return []
      const line = id === 'ebitdaMargin' ? 'ebitda' : id
      const inPlan = plan.initiatives.filter((i) => i.status === 'in').map((i) => i.id)
      const kpi = kpis.find((k) => k.computedFrom === `financials.${id}`)
      return [
        { level: 'initiative', id: inPlan[0] ?? '', label: `${inPlan.length} initiatives in plan` },
        { level: 'line', id: line, label: planLineLabel(line) },
        ...(kpi ? [kpiNode(kpi.id)] : []),
      ]
    }
    default:
      return []
  }
}
