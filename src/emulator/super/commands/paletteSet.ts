import SuperEmulator from "../superEmulator";

export default function paletteSet(
  superEmulator: SuperEmulator,
  data: number[]
): void {
  let paletteIds = []
  for (let i = 0; i < 4; i++) {
    const paletteId =  (data[(i << 1) + 1] << 8) + data[(i << 1) + 0]
    paletteIds.push(paletteId)
  }

  const flags = data[8]
  const applyAtf = (flags & 0x80) > 0
  const cancelMask = (flags & 0x40) > 0
  const atfId = flags & 0x3F

  console.log("[SUPER] PAL_SET command received", {
    paletteIds,
    applyAtf,
    cancelMask,
    atfId
  })

  paletteIds.forEach((id, i) =>
    superEmulator.palettes[i] = superEmulator.storedPalettes[id])

  if (applyAtf) {
    superEmulator.attributes.data = superEmulator.storedAttributeFiles[atfId]
  }
}