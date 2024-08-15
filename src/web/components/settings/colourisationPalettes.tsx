import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import DmgColourScanlineRenderer from "../../../emulator/graphics/dmgColourScanlineRenderer"
import { getPalette } from "../../../emulator/graphics/cgbColourisation"

interface Props {
  emulator: Emulator
}

interface ColourisationOption {
  description: string,
  paletteSetId: number,
  flags: number,
}

const OPTIONS: ColourisationOption[] = [
  {
    description: "Up",
    paletteSetId: 0x12,
    flags: 0x00
  },
  {
    description: "A + Up",
    paletteSetId: 0x10,
    flags: 0x05
  },
  {
    description: "B + Up",
    paletteSetId: 0x19,
    flags: 0x03
  },
  {
    description: "Left",
    paletteSetId: 0x18,
    flags: 0x05
  },
  {
    description: "A + Left",
    paletteSetId: 0x0D,
    flags: 0x05
  },
  {
    description: "B + Left",
    paletteSetId: 0x16,
    flags: 0x00
  },
  {
    description: "Down",
    paletteSetId: 0x17,
    flags: 0x00
  },
  {
    description: "A + Down",
    paletteSetId: 0x07,
    flags: 0x00
  },
  {
    description: "B + Down",
    paletteSetId: 0x1A,
    flags: 0x05
  },
  {
    description: "Right",
    paletteSetId: 0x05,
    flags: 0x00
  },
  {
    description: "A + Right",
    paletteSetId: 0x1C,
    flags: 0x03
  },
  {
    description: "B + Right",
    paletteSetId: 0x13,
    flags: 0x00
  },
]

export function ColourisationPalettes({ emulator }: Props) {
  const [selectedOption, setSelectedOption] = React.useState<number | "default">(
    (emulator.pictureProcessor.scanlineRenderer as DmgColourScanlineRenderer).colourisationOption
  )

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault()
    const selectedValueString = e.target.value
    const renderer = emulator.pictureProcessor.scanlineRenderer as DmgColourScanlineRenderer
    if (selectedValueString === "default") {
      renderer.colourisationOption = "default"
      renderer.setDefaultPalettes(emulator.memory.cartridge)
    } else {
      const optionId = parseInt(selectedValueString)
      renderer.colourisationOption = optionId
      const option = OPTIONS[optionId]
      const [bgp, obp0, obp1] = getPalette(option.paletteSetId, option.flags)
      renderer.setPalettesFromBytes(bgp, obp0, obp1)
      setSelectedOption(optionId)
    }
  }

  return <div>
    <h3>Palettes</h3>
    <label htmlFor="colourisation-option-select">Colourisation option</label>
    <select id="colourisation-option-select" value={selectedOption} onChange={e => handleChange(e)}>
      <option value="default">Default</option>
      {OPTIONS.map((entry, i) => <option value={i} key={i}>{entry.description}</option>)}
    </select>
  </div>
}