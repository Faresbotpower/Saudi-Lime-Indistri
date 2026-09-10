import type { ComponentType } from 'react'
import type { ViewId } from '../../strings'
import { Direction } from './Direction'
import { Portfolio } from './Portfolio'
import { Financials } from './Financials'
import { Operations } from './Operations'
import { Roadmap } from './Roadmap'
import { Tracker } from './Tracker'

export const views: Record<ViewId, ComponentType> = {
  direction: Direction,
  portfolio: Portfolio,
  financials: Financials,
  operations: Operations,
  roadmap: Roadmap,
  tracker: Tracker,
}
