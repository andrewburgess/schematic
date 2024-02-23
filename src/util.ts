import type { AssertEqual } from "./types"

export const assertEqual = <A, B>(value: AssertEqual<A, B>) => value
export const assertNever = (value: never) => value
