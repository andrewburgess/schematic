import { EnumType, SchematicError, SchematicErrorData, SchematicErrorType } from "./types"

export class SchematicParseError extends Error {
    constructor(public errors: SchematicError[]) {
        super()

        const errorMessage =
            this.errors.length > 1
                ? `${this.errors.length} errors occurred`
                : this.errors[0]?.message
        this.message = errorMessage ?? "Value failed to parse successfully"
    }
}

export function createInvalidExactValueError(
    received: any,
    expected: any,
    message?: string
): SchematicErrorData {
    return {
        message: message ?? `Expected value ${expected} but received ${received}`,
        received,
        expected,
        type: SchematicErrorType.InvalidExactValue
    }
}

export function createInvalidStringError(received: any, message: string): SchematicErrorData {
    return {
        message,
        received,
        type: SchematicErrorType.InvalidString
    }
}

export function createInvalidTypeError(
    path: (string | number)[],
    type: string,
    received: any,
    message?: string
): SchematicErrorData {
    let receivedType: string = typeof received
    if (typeof received === "object" && Array.isArray(received)) {
        receivedType = "array"
    } else if (typeof received === "object" && received === null) {
        receivedType = "null"
    } else if (typeof received === "object" && received instanceof Date) {
        receivedType = "date"
    }

    if (!message && typeof received === "undefined") {
        message = path.length > 0 ? `"${path.join(".")}" is required` : "Required"
    }

    return {
        message: message ?? `Expected ${type} but received ${receivedType}`,
        expected: type,
        received,
        type: SchematicErrorType.InvalidType
    }
}

export function createTooBigError(
    received: any,
    max: number | Date,
    exclusive?: boolean,
    message?: string
): SchematicErrorData {
    message =
        message ??
        `Expected value ${exclusive ? "less than" : "less than or equal to"} ${
            max instanceof Date ? max.toISOString() : max
        } but received ${received instanceof Date ? received.toISOString() : received}`

    return {
        message,
        received,
        maximum: max,
        type: SchematicErrorType.TooBig
    }
}

export function createTooSmallError(
    received: any,
    min: number | Date,
    exclusive?: boolean,
    message?: string
): SchematicErrorData {
    message =
        message ??
        `Expected value ${exclusive ? "greater than" : "greater than or equal to"} ${
            min instanceof Date ? min.toISOString() : min
        } but received ${received instanceof Date ? received.toISOString() : received}`

    return {
        message,
        received,
        minimum: min,
        type: SchematicErrorType.TooSmall
    }
}

export function createUnrecognizedValueError(
    received: any,
    expected: EnumType,
    message?: string
): SchematicErrorData {
    return {
        message:
            message ??
            `Unexpected value ${received} for enum "${Object.values(expected).join(" | ")}"`,
        received,
        expected: Object.values(expected),
        type: SchematicErrorType.UnrecognizedValue
    }
}
