import OnlineConnection from "./onlineConnection"


export default abstract class GameState<MessageType> {
  protected connection: OnlineConnection<MessageType, GameState<MessageType>>

  constructor(
    connection: OnlineConnection<MessageType, GameState<MessageType>>,
  ) {
    this.connection = connection
  }

  abstract gameName: string
  abstract name: string
  abstract state: object
  onEntry(): void {}
  onReceiveByteFromConsole(byte: number, respond: (response: number) => void): void {}
  onReceiveMessage(message: MessageType): void {}
  onClockTimeout(): void {}
}