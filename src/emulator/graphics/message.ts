export enum MessageType {
  MemoryWrite,
  RenderScanline,
  RenderScreen,
  SetCanvas,
  SetMonochromePalette
}

export interface MemoryWriteMessage {
  type: MessageType.MemoryWrite,
  address: number,
  value: number,
}

export interface RenderScalineMessage {
  type: MessageType.RenderScanline
}

export interface RenderScreenMessage {
  type: MessageType.RenderScreen
}

export interface SetCanvasMessage {
  type: MessageType.SetCanvas
  canvas: OffscreenCanvas
}

export interface SetMonochromePaletteMessage {
  type: MessageType.SetMonochromePalette
  palette: number[][]
}

export type Message =
  MemoryWriteMessage
  | RenderScalineMessage
  | RenderScreenMessage
  | SetCanvasMessage
  | SetMonochromePaletteMessage