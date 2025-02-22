import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"

interface State {

}

export default class TemplateState extends TetrisState {
  state: State
  name = "template"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = {}
  }

  override onEntry(): void {
    
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    
  }

  override onReceiveMessage(message: TetrisMessage): void {
    
  }

  override onClockTimeout(): void {
    
  }
}