import SuperEmulator from "../superEmulator";

export default function attributeSet(
  superEmulator: SuperEmulator,
  data: number[]
): void {
  const attributeFileId = data[0] & 0x3f
  const cancelMask = (data[0] & 0x40) > 0

  superEmulator.log("ATTR_SET command received", { attributeFileId, cancelMask })

  superEmulator.attributes.data = superEmulator.storedAttributeFiles[attributeFileId]
  if (cancelMask) {
    superEmulator.scanlineRenderer.maskMode = "UNMASK"
  }
}