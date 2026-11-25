import { nearestRotation } from '../utils/rotation'

describe('nearestRotation', () => {
  it('turns the short way round', () => {
    expect(nearestRotation(0, 90)).toBe(90)
    expect(nearestRotation(0, 270)).toBe(-90)
    expect(nearestRotation(-90, 180)).toBe(-180)
    expect(nearestRotation(90, 0)).toBe(0)
  })

  it('keeps going from where it is (angles beyond a full turn)', () => {
    expect(nearestRotation(-270, 0)).toBe(-360)
    expect(nearestRotation(360, 90)).toBe(450)
  })
})
