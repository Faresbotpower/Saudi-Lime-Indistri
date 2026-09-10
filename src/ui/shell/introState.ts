export const INTRO_KEY = 'strata-intro-seen'

export const shouldPlayIntro = (): boolean => {
  try {
    return window.sessionStorage.getItem(INTRO_KEY) !== '1'
  } catch {
    return true
  }
}

export const markIntroSeen = () => {
  try {
    window.sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* private mode */
  }
}
