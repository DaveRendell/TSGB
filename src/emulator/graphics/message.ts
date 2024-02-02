export enum MessageType {
  MemoryWrite,
  RenderScanline,
  RenderScreen,
  SetCanvas,
  SetMonochromePalette,
  IncrementWindowLine,
  FrameStart,
  ShareMemory,
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

export interface IncrementWindowLineMessage {
  type: MessageType.IncrementWindowLine
}

export interface FrameStartMessage {
  type: MessageType.FrameStart
  startTime: number
}

export interface ShareMemoryMessage {
  type: MessageType.ShareMemory
  vramData: SharedArrayBuffer
}

export type Message =
  MemoryWriteMessage
  | RenderScalineMessage
  | RenderScreenMessage
  | SetCanvasMessage
  | SetMonochromePaletteMessage
  | IncrementWindowLineMessage
  | FrameStartMessage
  | ShareMemoryMessage