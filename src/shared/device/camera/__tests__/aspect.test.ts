import { coverCrop, previewBox } from '../utils/aspect'

describe('coverCrop', () => {
  it('cuts the sides of a 4:3 portrait photo for a tall phone screen', () => {
    // 3024×4032 photo, 1080×2400 screen (9:20)
    expect(coverCrop(3024, 4032, 1080, 2400)).toEqual({
      originX: 605,
      originY: 0,
      width: 1814,
      height: 4032,
    })
  })

  it('cuts top and bottom when the view is wider than the photo', () => {
    expect(coverCrop(3000, 4000, 1000, 1000)).toEqual({
      originX: 0,
      originY: 500,
      width: 3000,
      height: 3000,
    })
  })

  it('keeps the photo when it already has the view aspect', () => {
    expect(coverCrop(3000, 4000, 750, 1000)).toBeNull()
  })

  it('keeps the photo while sizes are unknown', () => {
    expect(coverCrop(3000, 4000, 0, 0)).toBeNull()
  })
})

describe('previewBox', () => {
  it('fills the view for full screen', () => {
    expect(previewBox('full', 400, 900)).toEqual({ left: 0, top: 0, width: 400, height: 900 })
  })

  it('fits the aspect at full width, centered vertically', () => {
    expect(previewBox('3:4', 300, 900)).toEqual({ left: 0, top: 250, width: 300, height: 400 })
    expect(previewBox('1:1', 300, 900)).toEqual({ left: 0, top: 300, width: 300, height: 300 })
    expect(previewBox('9:16', 360, 900)).toEqual({ left: 0, top: 130, width: 360, height: 640 })
  })

  it('fits by height when the view is not tall enough', () => {
    expect(previewBox('9:16', 600, 800)).toEqual({ left: 75, top: 0, width: 450, height: 800 })
  })

  it('a 3:4 photo needs no crop for the 3:4 box', () => {
    const box = previewBox('3:4', 300, 900)
    expect(coverCrop(3000, 4000, box.width, box.height)).toBeNull()
  })
})
