import type { ComponentType } from 'react'
import type { ViewId } from '../../strings'
import { Direction } from './Direction'
import { Scorecard } from './Scorecard'
import { Portfolio } from './Portfolio'
import { Plans } from './Plans'
import { Financials } from './Financials'
import { Roadmap } from './Roadmap'
import { Tracker } from './Tracker'

export const views: Record<ViewId, ComponentType> = {
  direction: Direction,
  scorecard: Scorecard,
  portfolio: Portfolio,
  plans: Plans,
  financials: Financials,
  roadmap: Roadmap,
  tracker: Tracker,
}
