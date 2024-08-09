import SuperEmulator from "../superEmulator";
import SuperPalette from "../superPalette";

// https://gbdev.io/pandocs/SGB_Command_Palettes.html#palette-commands
export default function palettePair(paletteId0, paletteId1) {
  return function(superEmulator: SuperEmulator, data: number[]): void {
    const palette0 = new SuperPalette(data.slice(0, 8))
    const palette1 = new SuperPalette([
      ...data.slice(0, 2),
      ...data.slice(8, 15)
    ])
    console.log(`PAL${paletteId0}${paletteId1} received`, {
      [paletteId0]: palette0.colours,
      [paletteId1]: palette1.colours
    })

    superEmulator.palettes[paletteId0] = palette0
    superEmulator.palettes[paletteId1] = palette1
  }
}