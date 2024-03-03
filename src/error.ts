import { SchematicError, SchematicErrorType } from "./types"

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

export function createInvalidTypeError(
    path: (string | number)[],
    type: string,
    received: any,
    message?: string
): SchematicError {
    return {
        message: message ?? `Expected ${type} but received ${typeof received}`,
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
