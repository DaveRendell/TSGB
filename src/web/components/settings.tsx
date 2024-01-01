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
    [116,135,88],
    [51,60,38],
  ],
  "Ocean breeze": [
    [222,250,252],
    [180,228,231],
    [74,138,149],
    [37,39,61]
  ],
  "Puff ball": [
    [254,239,254],
    [231,188,231],
    [170,106,172],
    [62,36,61]
  ],
  "Burned In": [
    [254,239,240],
    [232,187,191],
    [181,98,111],
    [63,35,37]
  ],
  "Authentic": [
    [155,188,15],
    [139,172,15],
    [48,98,48],
    [15,56,15]
  ]
}

const arrayToColour = (components: number[]): string =>
  "#" + components.map(c => c.toString(16).padStart(2, "0")).join("")

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
  const [chosenPresetId, setChosenPresetId] = React.useState(-1)

  const updateMonochromePallette = (e: React.FormEvent) => {
    e.preventDefault()
    emulator.screen.colours = [
      colourToArray(monochromePallette0),
      colourToArray(monochromePallette1),
      colourToArray(monochromePallette2),
      colourToArray(monochromePallette3),
    ]
  }

  const applyPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault()
    const chosenId = parseInt(e.target.value)
    setChosenPresetId(chosenId)
    if (chosenId !== -1) {
      const pallette = Object.entries(MONOCHROME_PALLETES)[chosenId][1]
      setMonochromePallete0(arrayToColour(pallette[0]))
      setMonochromePallete1(arrayToColour(pallette[1]))
      setMonochromePallete2(arrayToColour(pallette[2]))
      setMonochromePallete3(arrayToColour(pallette[3]))
    }
  }

  return (<section>
    <h3>Settings</h3>
    <form onSubmit={updateMonochromePallette}>
      <label htmlFor="preset-selector">Use preset</label>
      <select id="preset-selector" value={chosenPresetId} onChange={applyPreset}>
        <option value={-1}>Choose</option>
        { Object.keys(MONOCHROME_PALLETES).map((name, i) =>
          <option value={i.toString()}>{name}</option>
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
    <pre>{JSON.stringify([
      colourToArray(monochromePallette0),
      colourToArray(monochromePallette1),
      colourToArray(monochromePallette2),
      colourToArray(monochromePallette3),
    ])}</pre>
  </section>)
}