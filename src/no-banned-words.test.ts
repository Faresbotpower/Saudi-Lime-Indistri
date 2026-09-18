import { strings } from './strings'
import { chapters } from './ui/walkthrough/script'

it('keeps partnership, joint venture and AI out of the interface copy', () => {
  const text = JSON.stringify(strings) + chapters.map((c) => c.caption + c.title).join(' ')
  for (const w of ['partnership', 'Partnership', 'joint venture', 'Joint venture', ' JV', 'AI '])
    expect(text).not.toContain(w)
  expect(/\bAI\b/.test(text)).toBe(false)
  expect(text).not.toContain('—')
})
