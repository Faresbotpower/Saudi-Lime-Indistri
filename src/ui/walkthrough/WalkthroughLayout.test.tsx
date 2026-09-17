import { act, render } from '@testing-library/react'
import App from '../../App'
import { useLevers } from '../../state/levers'
import { chapters, type Action } from './script'

/** Exercise the real chapter actions against the redesigned app, not isolated mock anchors. */
describe('walkthrough layout contract', () => {
  it('keeps every spotlight target mounted across all fourteen chapters and their actions', () => {
    const api = useLevers.getState()
    api.stopWalkthrough()
    api.reset()
    api.enter()
    render(<App />)
    const assertTarget = (selector: string | null) => {
      if (selector)
        expect(
          document.querySelector(selector),
          `Missing walkthrough target: ${selector}`,
        ).not.toBeNull()
    }
    const run = (action: Action) => {
      let focus: string | null = null
      act(() =>
        action.run(
          useLevers.getState(),
          (id, _from, to) => useLevers.getState().setLever(id, to),
          (selector) => {
            focus = selector
          },
        ),
      )
      assertTarget(focus)
    }
    for (const chapter of chapters) {
      chapter.actions.filter((a) => a.at === 0).forEach(run)
      assertTarget(chapter.focus ?? null)
      chapter.actions.filter((a) => a.at !== 0).forEach(run)
    }
    expect(useLevers.getState().view).toBe('direction')
    expect(useLevers.getState().scenario).toBe('base')
    expect(useLevers.getState().openInitiativeId).toBeNull()
  })
})
