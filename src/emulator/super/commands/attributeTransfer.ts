import SuperEmulator from "../superEmulator";

export default function attributeTransfer(
  superEmulator: SuperEmulator
): void {
  console.log("[SUPER] ATTR_TRN command received")

  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.vramTransferType = "attribute"
}
