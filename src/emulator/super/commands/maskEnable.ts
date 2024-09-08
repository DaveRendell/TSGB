import SuperEmulator from "../superEmulator"

const MASK_MODES = {
  UNMASK: "UNMASK",
  FREEZE: "FREEZE",
  BLACK: "BLACK",
  BLANK: "BLANK",
} as const

export type MaskMode = typeof MASK_MODES[keyof typeof MASK_MODES]

const MaskModes: MaskMode[] = Object.values(MASK_MODES)

export default function maskEnable(
  superEmulator: SuperEmulator,
  data: number[]
): void {
  const maskCommand = MaskModes[data[0] & 0x3]

  superEmulator.log("MASK_EN command received", {
    maskCommand
  })

  superEmulator.scanlineRenderer.maskMode = maskCommand
}