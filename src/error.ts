import { EnumType, SchematicError, SchematicErrorType } from "./types"

export class SchematicParseError extends Error {
    constructor(public errors: SchematicError[]) {
        super()

        this.message =
            this.errors.length > 1
                ? `${this.errors.length} errors occurred`
                : this.errors[0].message
    }
}

export function createInvalidExactValueError(
    path: (string | number)[],
    received: any,
    expected: any,
    message?: string
): SchematicError {
    return {
        message: message ?? `Expected value ${expected} but received ${received}`,
        path,
        received,
        expected,
        type: SchematicErrorType.InvalidExactValue
    }
}

export function createInvalidStringError(
    path: (string | number)[],
    received: any,
    message: string
): SchematicError {
    return {
        message,
        path,
        received,
        type: SchematicErrorType.InvalidString
    }
}

export function createInvalidTypeError(
    path: (string | number)[],
    type: string,
    received: any,
    message?: string
): SchematicError {
    let receivedType: string = typeof received
    if (typeof received === "object" && Array.isArray(received)) {
        receivedType = "array"
    } else if (typeof received === "object" && received === null) {
        receivedType = "null"
    } else if (typeof received === "object" && received instanceof Date) {
        receivedType = "date"
    }
    return {
        message: message ?? `Expected ${type} but received ${receivedType}`,
        expected: type,
        path,
        received,
        type: SchematicErrorType.InvalidType
    }
}

export function createTooBigError(
    path: (string | number)[],
    received: any,
    max: number | Date,
    exclusive?: boolean,
    message?: string
): SchematicError {
    message =
        message ??
        `Expected value ${exclusive ? "less than" : "less than or equal to"} ${
            max instanceof Date ? max.toISOString() : max
        } but received ${received instanceof Date ? received.toISOString() : received}`

    return {
        message,
        path,
        received,
        max,
        type: SchematicErrorType.TooBig
    }
}

export function createTooSmallError(
    path: (string | number)[],
    received: any,
    min: number | Date,
    exclusive?: boolean,
    message?: string
): SchematicError {
    message =
        message ??
        `Expected value ${exclusive ? "greater than" : "greater than or equal to"} ${
            min instanceof Date ? min.toISOString() : min
        } but received ${received instanceof Date ? received.toISOString() : received}`

    return {
        message,
        path,
        received,
        min,
        type: SchematicErrorType.TooSmall
    }
}

export function createUnrecognizedValueError(
    path: (string | number)[],
    received: any,
    expected: EnumType,
    message?: string
): SchematicError {
    return {
        message:
            message ??
            `Unexpected value ${received} for enum "${Object.values(expected).join(" | ")}"`,
        path,
        received,
        expected: Object.values(expected),
        type: SchematicErrorType.UnrecognizedValue
    }
}
