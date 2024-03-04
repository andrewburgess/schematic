import { Schematic } from "./schematic"
import {
    CoerceSymbol,
    type AssertEqual,
    type Defaultable,
    ValidationCheck,
    DefaultValueSymbol
} from "./types"

export const assertEqualType = <A, B>(value: AssertEqual<A, B>) => value
export const assertNever = (value: never) => value

export function clone<T>(src: T): T {
    if (typeof src !== "object" || src === null) {
        return src
    }
    if (Array.isArray(src)) {
        return src.map((elem) => clone(elem)) as any
    }
    const cpy: any = Object.create(null)
    for (const k in src) {
        cpy[k] = clone(src[k])
    }
    for (const s of Object.getOwnPropertySymbols(src)) {
        cpy[s] = clone((src as any)[s])
    }
    Object.setPrototypeOf(cpy, Object.getPrototypeOf(src))
    return cpy
}

export function addValidationCheck<TValue, TSchematic extends Schematic<TValue>>(
    schematic: TSchematic,
    check: ValidationCheck<TValue>
) {
    const cloned = clone(schematic)

    cloned.validationChecks.push(check)

    return cloned
}

export function withCoerce<TSchematic extends Schematic<any>>(schematic: TSchematic) {
    const cloned = clone(schematic)

    cloned[CoerceSymbol] = true

    return cloned
}

export function withDefault<TValue, TSchematic extends Schematic<TValue> & Defaultable<TValue>>(
    schematic: TSchematic,
    defaultValue: TValue | (() => TValue)
) {
    const cloned = clone(schematic)

    cloned[DefaultValueSymbol] = defaultValue

    return cloned
}
