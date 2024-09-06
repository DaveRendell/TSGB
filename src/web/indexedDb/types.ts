interface Pending {
  status: "pending"
}

interface Done<Result> {
  status: "done"
  result: Result
}

interface Failed {
  status: "failed"
  error: Error
}

type Async<Result> = Pending | Done<Result> | Failed

export default Async

export const PENDING: Pending = { status: "pending" }
