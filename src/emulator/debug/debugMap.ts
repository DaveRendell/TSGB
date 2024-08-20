export default interface DebugMap {
  
}

interface Bank {
  number: number
  sections: Section[]
}

interface Section {
  name: string
  start: number
  end: number // Note: inclusive
  symbols: Symbol[]
}

interface Symbol {
  address: number
  name: string
}