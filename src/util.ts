import { Schematic } from "./schematic"
import {
    CoerceSymbol,
    DefaultValueSymbol,
    ValidationCheck,
    type AssertEqual,
    type Defaultable
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

    cloned.validationChecks.push(check as any)

    return cloned
}

export function isArray(value: unknown): value is any[] {
    return typeof value === "object" && Array.isArray(value)
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date
}

export function isObject(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function mergeValues(
    left: any,
    right: any
): { isValid: true; value: any } | { isValid: false } {
    if (left === right) {
        return { isValid: true, value: left }
    }

    if (isObject(left) && isObject(right)) {
        const rightKeys = Object.keys(right)
        const sharedKeys = Object.keys(left).filter((key) => rightKeys.includes(key))

        const merged: any = { ...left, ...right }
        for (const key of sharedKeys) {
            const leftValue = (left as any)[key]
            const rightValue = (right as any)[key]
            const result = mergeValues(leftValue, rightValue)
            if (!result.isValid) {
                return result
            }
            merged[key] = result.value
        }

        return { isValid: true, value: merged }
    }

    if (isArray(left) && isArray(right)) {
        if (left.length !== right.length) {
            return { isValid: false }
        }

        const arr: any[] = []
        for (let i = 0; i < left.length; i++) {
            const leftItem = left[i]
            const rightItem = right[i]
            const shared = mergeValues(leftItem, rightItem)

            if (!shared.isValid) {
                return shared
            }

            arr.push(shared.value)
        }

        return { isValid: true, value: arr }
    }

    if (isDate(left) && isDate(right)) {
        if (left.getTime() !== right.getTime()) {
            return { isValid: false }
        }

        return { isValid: true, value: left }
    }

    return { isValid: false }
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
