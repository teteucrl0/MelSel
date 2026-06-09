import { describe, expect, it } from 'vitest'
import {
  BeeTrailIcon,
  FieldLinesStamp,
  HoneycombStamp,
  WildflowerStamp,
} from './ThematicIllustrations'

describe('ThematicIllustrations', () => {
  it('renderiza SVGs temáticos acessíveis', () => {
    const icons = [HoneycombStamp({}), WildflowerStamp({}), FieldLinesStamp({}), BeeTrailIcon({})]

    icons.forEach((icon) => {
      expect(icon.type).toBe('svg')
      expect(icon.props['aria-hidden']).toBe(true)
      expect(icon.props.viewBox).toMatch(/^\d+\s\d+\s\d+\s\d+$/)
    })
  })
})
