import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import { ColourStyle } from "../../emulator/memory/registers/paletteRegisters"

interface Props {
  emulator: Emulator
}

const MONOCHROME_PALETES = {
  Greyscale: [
    [255, 255, 255],
    [192, 192, 192],
    [96, 96, 96],
    [0, 0, 0],
  ],
  "Greeny greens": [
    [233, 245, 219],
    [207, 225, 185],
    [116, 135, 88],
    [51, 60, 38],
  ],
  "Ocean breeze": [
    [222, 250, 252],
    [180, 228, 231],
    [74, 138, 149],
    [37, 39, 61],
  ],
  "Puff ball": [
    [254, 239, 254],
    [231, 188, 231],
    [170, 106, 172],
    [62, 36, 61],
  ],
  "Burned In": [
    [254, 239, 240],
    [232, 187, 191],
    [181, 98, 111],
    [63, 35, 37],
  ],
  Authentic: [
    [155, 188, 15],
    [139, 172, 15],
    [48, 98, 48],
    [15, 56, 15],
  ],
}

const arrayToColour = (components: number[]): string =>
  "#" + components.map((c) => c.toString(16).padStart(2, "0")).join("")

const colourToArray = (colour: string): number[] => [
  parseInt("0x" + colour.slice(1, 3)),
  parseInt("0x" + colour.slice(3, 5)),
  parseInt("0x" + colour.slice(5, 7)),
]

export default function Settings({ emulator }: Props) {
  const [monochromePalette0, setMonochromePalete0] = React.useState(
    arrayToColour(emulator.pictureProcessor.scanlineRenderer.colours[0]),
  )
  const [monochromePalette1, setMonochromePalete1] = React.useState(
    arrayToColour(emulator.pictureProcessor.scanlineRenderer.colours[1]),
  )
  const [monochromePalette2, setMonochromePalete2] = React.useState(
    arrayToColour(emulator.pictureProcessor.scanlineRenderer.colours[2]),
  )
  const [monochromePalette3, setMonochromePalete3] = React.useState(
    arrayToColour(emulator.pictureProcessor.scanlineRenderer.colours[3]),
  )
  const [chosenPresetId, setChosenPresetId] = React.useState(-1)

  const [colourGrading, setColourGrading] = React.useState(emulator.memory.registers.backgroundPalettes.colourStyle)

  const updatePalette = (id: number, colour: number[]) => {
    emulator.pictureProcessor.scanlineRenderer.colours.splice(id, 1, colour)
    window.localStorage.setItem(
      "monochromePalette",
      JSON.stringify(emulator.pictureProcessor.scanlineRenderer.colours),
    )
    switch (id) {
      case 0:
        setMonochromePalete0(arrayToColour(colour))
        break
      case 1:
        setMonochromePalete1(arrayToColour(colour))
        break
      case 2:
        setMonochromePalete2(arrayToColour(colour))
        break
      case 3:
        setMonochromePalete3(arrayToColour(colour))
        break
    }
  }

  const applyPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault()
    const chosenId = parseInt(e.target.value)
    setChosenPresetId(chosenId)
    if (chosenId !== -1) {
      const palette = Object.entries(MONOCHROME_PALETES)[chosenId][1]
      updatePalette(0, palette[0])
      updatePalette(1, palette[1])
      updatePalette(2, palette[2])
      updatePalette(3, palette[3])
    }
  }

  const pickColourGrading =  (grading: ColourStyle) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    emulator.memory.registers.backgroundPalettes.colourStyle = grading
    emulator.memory.registers.objectPalettes.colourStyle = grading
    emulator.memory.registers.backgroundPalettes.updateAllColours()
    emulator.memory.registers.objectPalettes.updateAllColours()
    setColourGrading(grading)
  }

  const [isMuted, setIsMuted] = React.useState(emulator.audioProcessor.isMuted)
  const [volume, setVolume] = React.useState(1.0)

  const toggleMute = () => {
    emulator.audioProcessor.isMuted = !emulator.audioProcessor.isMuted
    setIsMuted(emulator.audioProcessor.isMuted)
    if (emulator.audioProcessor.isMuted) {
      emulator.audioProcessor.emulatorAudioControl.gain.setValueAtTime(
        0,
        emulator.audioProcessor.audioContext.currentTime
      )
    } else {
      emulator.audioProcessor.emulatorAudioControl.gain.setValueAtTime(
        volume,
        emulator.audioProcessor.audioContext.currentTime
      )
    }
  }

  const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
    if (!emulator.audioProcessor.isMuted) {
      emulator.audioProcessor.emulatorAudioControl.gain.setValueAtTime(
        volume,
        emulator.audioProcessor.audioContext.currentTime
      )
    }
  }

  return (
    <section>
      <h2>Settings</h2>
      <div>
        <h3>Audio</h3>
        <label htmlFor="mute">Mute</label>
        <input
          type="checkbox"
          id="mute"
          name="mute"
          checked={isMuted}
          onChange={() => toggleMute()}
        /><br/>
        <label htmlFor="volume">Volume</label>
        <input
          type="range"
          id="volume"
          name="volume"
          min="0"
          max="2"
          step="0.05"
          value={volume}
          onChange={updateVolume}
        />
      </div>
      <div>
        <h3>Set monochrome palette</h3>
        <label htmlFor="preset-selector">Use preset</label>
        <select
          id="preset-selector"
          value={chosenPresetId}
          onChange={applyPreset}
        >
          <option value={-1}>Choose</option>
          {Object.keys(MONOCHROME_PALETES).map((name, i) => (
            <option value={i.toString()}>{name}</option>
          ))}
        </select>
        <br />
        <label htmlFor="colour-0">Colour 0:</label>
        <input
          type="color"
          name="colour-0"
          value={monochromePalette0}
          onChange={(e) => updatePalette(0, colourToArray(e.target.value))}
        />
        <label htmlFor="colour-1">Colour 1:</label>
        <input
          type="color"
          name="colour-1"
          value={monochromePalette1}
          onChange={(e) => updatePalette(1, colourToArray(e.target.value))}
        />
        <label htmlFor="colour-2">Colour 2:</label>
        <input
          type="color"
          name="colour-2"
          value={monochromePalette2}
          onChange={(e) => updatePalette(2, colourToArray(e.target.value))}
        />
        <label htmlFor="colour-3">Colour 3:</label>
        <input
          type="color"
          name="colour-3"
          value={monochromePalette3}
          onChange={(e) => updatePalette(3, colourToArray(e.target.value))}
        />
      </div>
      <div>
        <h3>Colour grading</h3>
        Pick the colour grading to apply to colour games<br/>
        <input type="radio" id="cg_washed" name="colour_grading" value="WASHED" checked={colourGrading == ColourStyle.Washed} onChange={pickColourGrading(ColourStyle.Washed)} />
        <label htmlFor="cg_washed">Washed out (resembles appearance on LCD display)</label><br/>
        <input type="radio" id="cg_raw" name="colour_grading" value="RAW" checked={colourGrading == ColourStyle.Raw} onChange={pickColourGrading(ColourStyle.Raw)} />
        <label htmlFor="cg_raw">Raw colours</label><br/>
        <input type="radio" id="cg_vapourwave" name="colour_grading" value="RAW" checked={colourGrading == ColourStyle.Vapourwave} onChange={pickColourGrading(ColourStyle.Vapourwave)} />
        <label htmlFor="cg_vapourwave">Vapourwave</label><br/>
      </div>
    </section>
  )
}
