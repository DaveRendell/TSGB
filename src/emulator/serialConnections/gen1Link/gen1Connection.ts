import SerialRegisters from "../../memory/registers/serialRegisters";
import OnlineConnection from "../onlineConnection";
import Gen1Message from "./gen1Message";
import Gen1State from "./gen1State";
import PrimaryNotConnectedState from "./states/primaryNotConnectedState";
import SecondaryNotConnectedState from "./states/secondaryNotConnectedState";

export default class Gen1Connection extends OnlineConnection<Gen1Message, Gen1State> {
  constructor(serialRegisters: SerialRegisters) {
    super(
      serialRegisters,
      (self: Gen1Connection) => new SecondaryNotConnectedState(self),
      Gen1Message.parse,    
    )
  }

  override onConnection() {
    this.setGameState(
      this.isHost
        ? new PrimaryNotConnectedState(this)
        : new SecondaryNotConnectedState(this)
    )
  }
}