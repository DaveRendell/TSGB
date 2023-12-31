import * as React from "react"
import { Emulator } from "../../emulator/emulator"

interface Props {
  emulator: Emulator
}

const MONOCHROME_PALLETES = {
  "Greyscale": [
    [255, 255, 255],
    [192, 192, 192],
    [96, 96, 96],
    [0, 0, 0],
  ],
  "Greeny greens": [
    [233, 245, 219],
    [207,225,185],
    [151,169,124],
    [113,131,85],
  ],
}

const arrayToColour = (components: number[]): string =>
  "#" + components.map(c => c.toString(16).padStart(2)).join("")

const colourToArray = (colour: string): number[] => [
  parseInt( "0x" + colour.slice(1, 3)),
  parseInt( "0x" + colour.slice(3, 5)),
  parseInt( "0x" + colour.slice(5, 7)),
]

export default function Settings({ emulator }: Props) {
  const [monochromePallette0, setMonochromePallete0] = React.useState(arrayToColour(emulator.screen.colours[0]))
  const [monochromePallette1, setMonochromePallete1] = React.useState(arrayToColour(emulator.screen.colours[1]))
  const [monochromePallette2, setMonochromePallete2] = React.useState(arrayToColour(emulator.screen.colours[2]))
  const [monochromePallette3, setMonochromePallete3] = React.useState(arrayToColour(emulator.screen.colours[3]))

  const updateMonochromePallette = (e: React.FormEvent) => {
    e.preventDefault()
    emulator.screen.colours = [
      colourToArray(monochromePallette0),
      colourToArray(monochromePallette1),
      colourToArray(monochromePallette2),
      colourToArray(monochromePallette3),
    ]
  }

  return (<section>
    <h3>Settings</h3>
    <form onSubmit={updateMonochromePallette}>
      <label htmlFor="preset-selector">Use preset</label>
      <select id="preset-selector">
        { Object.keys(MONOCHROME_PALLETES).map((name, i) =>
          <option id={i.toString()}>{name}</option>
        )}
      </select>
      <label htmlFor="colour-0">Colour 0</label>
      <input
        type="color"
        name="colour-0"
        value={monochromePallette0}
        onChange={(e) => setMonochromePallete0(e.target.value)} />
      <label htmlFor="colour-1">Colour 1</label>
      <input
        type="color"
        name="colour-1"
        value={monochromePallette1}
        onChange={(e) => setMonochromePallete1(e.target.value)} />
      <label htmlFor="colour-2">Colour 2</label>
      <input
        type="color"
        name="colour-2"
        value={monochromePallette2}
        onChange={(e) => setMonochromePallete2(e.target.value)} />
      <label htmlFor="colour-3">Colour 3</label>
      <input
        type="color"
        name="colour-3"
        value={monochromePallette3}
        onChange={(e) => setMonochromePallete3(e.target.value)} />
      <input type="submit" value="Update monochrome pallette" />
    </form>
  </section>)
}