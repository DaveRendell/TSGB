import { MutableValue } from "../types";

function getMask(intSize: number): number {
  return (1 << intSize) - 1
}

export function add<IntSize extends number>(
  value: MutableValue<IntSize>,
  amount: number
): void {
  value.write((value.read() + amount) & getMask(value.intSize))
}

export function increment<IntSize extends number>(
  value: MutableValue<IntSize>
): void {
  value.write((value.read() + 1) & getMask(value.intSize))
}

export function decrement<IntSize extends number>(
  value: MutableValue<IntSize>
): void {
  value.write((value.read() - 1) & getMask(value.intSize))
}