import CpuRegisters from "../../src/emulator/register"

describe("CpuRegisters", () => {
  let registers: CpuRegisters

  beforeEach(() => {
    registers = new CpuRegisters()
  })

  it("allows access to 8-bit registers" , () => {
    registers.get8("A").write(0x77)
    expect(registers.get8("A").read()).toBe(0x77)
  })

  it("allows access to standalone 16-bit registers" , () => {
    registers.get16("SP").write(0x77AA)
    expect(registers.get16("SP").read()).toBe(0x77AA)
  })

  describe("composite 16-bit registers", () => {
    it("allows them to act as normal 16-bit registers" , () => {
      registers.get16("HL").write(0x77AA)
      expect(registers.get16("HL").read()).toBe(0x77AA)
    })

    it("updates the 8-bit registers as well" , () => {
      registers.get16("HL").write(0x77AA)
      expect(registers.get8("H").read()).toBe(0x77)
      expect(registers.get8("L").read()).toBe(0xAA)
    })

    it("reflects changes to the 8-bit registers" , () => {
      registers.get8("H").write(0xAB)
      registers.get8("L").write(0xCD)
      expect(registers.get16("HL").read()).toBe(0xABCD)
    })
  })

  describe("flag registers", () => {
    it("acts as a 1 bit register", () => {
      registers.getFlag("Operation").write(1)
      expect(registers.getFlag("Operation").read()).toBe(1)
    })

    it("updates the F register", () => {
      registers.getFlag("Half-Carry").write(1)
      registers.getFlag("Zero").write(1)
      expect(registers.get8("F").read()).toBe(0b10100000)
    })
    
    it("reflects changes to the F register", () => {
      registers.get8("F").write(0b00110000)
      expect(registers.getFlag("Zero").read()).toBe(0)
      expect(registers.getFlag("Operation").read()).toBe(0)
      expect(registers.getFlag("Half-Carry").read()).toBe(1)
      expect(registers.getFlag("Carry").read()).toBe(1)
    })
  })
})