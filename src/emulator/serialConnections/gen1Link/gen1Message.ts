import { z } from "zod"
import Connected from "./messages/connected"
import SelectLinkType from "./messages/selectLinkType"
import ConfirmLinkType from "./messages/confirmLinkType"

const Gen1Message = z.union([
  Connected,
  SelectLinkType,
  ConfirmLinkType,
])

type Gen1Message = z.infer<typeof Gen1Message>

export default Gen1Message
