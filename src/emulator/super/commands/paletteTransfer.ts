import SuperEmulator from "../superEmulator";

export default function paletteTransfer(
  superEmulator: SuperEmulator
): void {
  console.log("[SUPER] PAL_TRN command received")

  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.vramTransferType = "palette"
}
