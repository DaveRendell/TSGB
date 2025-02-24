import { z } from "zod";

const SelectLinkType = z.object({
  type: z.literal("select-link-type"),
  linkType: z.union([
    z.literal("trade"),
    z.literal("battle"),
    z.literal("cancel"),
  ])
})

export default SelectLinkType
