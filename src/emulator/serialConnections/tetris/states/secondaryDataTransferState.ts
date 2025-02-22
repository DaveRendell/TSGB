import TetrisConnection from "../tetrisConnection"
import TetrisState from "../tetrisState"
import SecondaryInGameState from "./secondaryInGameState"

const NEGOTIATION_REQUEST_BYTE = 0x29
const NEGOTIATION_RESPONSE_BYTE = 0x55
const DIFFICULTY_CHOICE_CONFIRM = 0x60
const DIFFICULTY_CHOICE_RESPONSE = 0x55

const NEXT_ROUND_REQUEST = 0x60
const NEXT_ROUND_ACKNOLEDGEMENT = 0x27
const NEXT_ROUND = 0x79

const ROUND_START_MAGIC_BYTES = [0x30, 0x00, 0x02, 0x02, 0x20]

interface HandshakeStep {
  name: string,
  primaryByte: number,
  secondaryByte: number,
}

interface DataStep {
  name: string,
  data: number[],
}

type Step = HandshakeStep | DataStep

interface State {
  steps: Step[]
}

export default class SecondaryDataTransferState extends TetrisState {
  state: State
  name = "secondary-data-transfer"

  constructor(
    connection: TetrisConnection,
    pieceData: number[],
    lineData: number[],
    fromDifficultyScreen: boolean,
  ) {
    super(connection)
    this.state = {
      steps: [
        ...(fromDifficultyScreen ? [{
          name: "difficulty-confirmation",
          primaryByte: DIFFICULTY_CHOICE_CONFIRM,
          secondaryByte: DIFFICULTY_CHOICE_RESPONSE,
        }] : []),
        {
          name: "start-line-transfer-confirmation",
          primaryByte: NEGOTIATION_REQUEST_BYTE,
          secondaryByte: NEGOTIATION_RESPONSE_BYTE,
        },
        {
          name: "transfer-line-data",
          data: lineData,
        },
        {
          name: "start-piece-transfer-confirmation",
          primaryByte: NEGOTIATION_REQUEST_BYTE,
          secondaryByte: NEGOTIATION_RESPONSE_BYTE,
        },
        {
          name: "transfer-piece-data",
          data: [...pieceData, ...ROUND_START_MAGIC_BYTES],
        }
      ]
    }
  }

  private nextStep() {
    this.state.steps = this.state.steps.slice(1)
    

    if (this.state.steps.length === 0) {
      console.log("Data transfer complete")
      this.connection.setGameState(
        new SecondaryInGameState(this.connection)
      )
    } else {
      console.log("Moving to step", this.state.steps[0].name)
    }
  }

  override onEntry(): void {
    this.connection.setClockMs(30)
  }


  override onClockTimeout(): void {
    const currentStep = this.state.steps[0]
    if (currentStep && "primaryByte" in currentStep) {
      this.connection.serialRegisters.pushFromExternal(
        currentStep.primaryByte,
        (secondaryResponse) => {
          this.connection.setClockMs(5)
          if (secondaryResponse === currentStep.secondaryByte) {
            this.nextStep()
          } else {
            console.log("wrong byte response:", secondaryResponse)
          }
        }
      )
    } else if (currentStep && "data" in currentStep) {
      if (this.connection.serialRegisters.unreadSerialData) {
        this.connection.setClockMs(5)
        return
      }
      if (currentStep.data.length === 0) {
        this.connection.setClockMs(5)
        this.nextStep()
        return
      } else {
        const [nextByte] = currentStep.data.splice(0, 1)

        this.connection.serialRegisters.pushFromExternal(nextByte)

        this.connection.setClockMs(currentStep.data.length === 0 ? 30 : 5)
      }
    }
  }
}