import Gen1Connection from "../gen1Connection"
import Gen1Message from "../gen1Message"
import Gen1State from "../gen1State"


interface State {

}

export default class SecondarySelectedTradeState extends Gen1State {
  state: State
  name = "secondary-selected-trade"

  constructor(connection: Gen1Connection) {
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

  override onReceiveMessage(message: Gen1Message): void {
    
  }

  override onClockTimeout(): void {
    
  }
}