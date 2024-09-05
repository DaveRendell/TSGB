import SuperEmulator from "../superEmulator";

export default function paletteTransfer(
  superEmulator: SuperEmulator
): void {
  superEmulator.log("PAL_TRN command received")

  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.vramTransferType = "palette"
}
