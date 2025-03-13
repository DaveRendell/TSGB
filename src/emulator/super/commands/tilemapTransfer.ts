import SuperEmulator from "../superEmulator";

export default function tilemapTransfer(
  superEmulator: SuperEmulator
): void {
  superEmulator.log("PCT_TRN command received")

  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.vramTransferType = "tilemap"
}