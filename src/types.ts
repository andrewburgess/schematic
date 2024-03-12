import { AnyValueSchematic, OptionalSchematic, Schematic } from "./schematic"

// #region Utility Types
/**
 * A Schematic of any type
 */
export type AnySchematic = Schematic<any>
/**
 * Asserts that the input type is assignable to the expected type
 */
export type AssertEqual<Type, Expected> = Type extends Expected ? true : false
export type EnumKeys<TEnum> = TEnum extends readonly (string | number)[]
    ? TEnum[number]
    : TEnum extends { readonly [key: string]: string | number }
      ? TEnum[keyof TEnum]
      : TEnum extends { readonly [key: number]: string | number }
        ? keyof TEnum
        : never
/**
 * A type that can be used as an enum
 */
export type EnumType =
    | { readonly [key: string]: string | number }
    | { readonly [key: number]: string | number }
/**
 * Flattens the type definition to a root object
 */
export type Flatten<Type> = Identity<{ [key in keyof Type]: Type[key] }>
/**
 * Identity type
 */
export type Identity<Type> = Type
/**
 * Infers the output type of a Schematic
 */
export type Infer<TSchematic> = TSchematic extends AnySchematic
    ? TSchematic[typeof OutputSymbol]
    : never
/**
 * Infers the object shape output of a Schematic
 */
export type InferObject<TObject extends SchematicObjectShape> = Flatten<
    {
        [key in RequiredKeys<TObject>]: TObject[key][typeof OutputSymbol]
    } & {
        [key in OptionalKeys<TObject>]?: TObject[key][typeof OutputSymbol]
    }
>
/**
 * Returns the keys of a Schematic that are an OptionalSchematic or
 * an AnyValueSchematic (which means they can be anything)
 */
type OptionalKeys<Type extends SchematicObjectShape> = {
    [key in keyof Type]: Type[key] extends OptionalSchematic<any>
        ? key
        : Type[key] extends AnyValueSchematic
          ? key
          : never
}[keyof Type]
/**
 * Returns the keys of a Schematic that are required (any that are not marked
 * as optional)
 */
type RequiredKeys<Type extends SchematicObjectShape> = Exclude<
    string & keyof Type,
    OptionalKeys<Type>
>
export type RecordKey<T> = T extends EnumType ? T : T extends object ? never : string | number
/**
 * Removes the OptionalSchematic from the type, and returns the underlying
 * Schematic type
 */
export type RemoveOptional<Type> =
    Type extends OptionalSchematic<infer InnerType> ? RemoveOptional<InnerType> : Type
/**
 * Removes the "path" property from the type
 */
type RemovePath<Type extends object> = Type extends any ? Omit<Type, "path"> : never
/**
 * Represents an object of Schematic types
 */
export type SchematicObjectShape = {
    [key: string]: AnySchematic
}
// #endregion

// #region Schematic Symbols
export const OutputSymbol = Symbol("output")
// #endregion

// #region Schematic Enhancements
/**
 * Options to use when building a Schematic
 */
export interface SchematicOptions {
    /**
     * If true, attempts to coerce the value into the type will be made,
     * such as converting a string to a number, or "true" to a boolean
     */
    coerce?: boolean
    /**
     * Message for if the type parsing fails
     */
    message?: string
}

export interface Allowable<TValue> {
    /**
     * Allow the value to be one of the provided values
     */
    allow(values: TValue[], message?: string): Schematic<TValue>
}

/**
 * A Schematic that will attempt to coerce the input value into the
 * expected type
 */
export interface Coercable {
    _coerce: boolean
    coerce(): AnySchematic
}

/**
 * A Schematic that can have a default value
 */
export interface Defaultable<TValue> {
    _defaultValue: TValue | (() => TValue) | undefined
    /**
     * Assign the value to be used as a default when the value is not
     * provided
     */
    default(value: TValue | (() => TValue)): Schematic<TValue>
}
// #endregion

// #region Schematic Validation
/**
 * Base data to be passed into Schematic parsing functions to
 * track errors
 */
export interface SchematicContext {
    readonly data: any
    readonly path: (string | number)[]
    readonly parent?: SchematicContext | null
    readonly root: {
        readonly errors: SchematicError[]
    }
}

/**
 * Context when running `ensure`, `test`, or `transform`
 * functions on a Schematic
 */
export interface SchematicTestContext {
    addError: (error: SchematicErrorData) => void
    path: (string | number)[]
}

/**
 * Function that transforms a parsed Schematic value to a new value
 */
export type TransformFn<TSchematic, TOutput> = (
    value: Infer<TSchematic>,
    context: SchematicTestContext
) => TOutput | Promise<TOutput>

/**
 * Function that checks a parsed Schematic value for validity
 */
export type ValidationCheck<TValue> = (
    value: TValue,
    context: SchematicTestContext
) => Promise<void> | void

/**
 * Quick validation check function that checks a parsed Schematic value
 * for validity
 */
export type TestCheck<TValue> = (value: TValue) => Promise<boolean> | boolean

/**
 * Type of error that can be returned from a Schematic validation
 */
export enum SchematicErrorType {
    /**
     * The provided value did not exactly match an expected value
     */
    InvalidExactValue = "InvalidExactValue",
    /**
     * The provided value did not match both sides of a Schematic
     * intersection
     */
    InvalidIntersection = "InvalidIntersection",
    /**
     * The provided string value did not match the expected format
     */
    InvalidString = "InvalidString",
    /**
     * The provided value did not match the expected type
     */
    InvalidType = "InvalidType",
    /**
     * The provided value did not match any of the expected types
     */
    InvalidUnion = "InvalidUnion",
    /**
     * The provided value was too large
     */
    TooBig = "TooBig",
    /**
     * The provided value was too small
     */
    TooSmall = "TooSmall",
    /**
     * The provided object had keys that were not defined in the
     * Schematic
     */
    UnrecognizedKeys = "UnrecognizedKeys",
    /**
     * The provided value was not found in the list of expected values
     */
    UnrecognizedValue = "UnrecognizedValue",
    /**
     * The provided value failed a validation check
     */
    ValidationError = "ValidationError"
}

interface BaseSchematicError {
    message?: string
    path: (string | number)[]
}

export interface SchematicInvalidExactValueError extends BaseSchematicError {
    type: SchematicErrorType.InvalidExactValue
    expected: any
    received: any
}

export interface SchematicInvalidIntersectionError extends BaseSchematicError {
    received: any
    type: SchematicErrorType.InvalidIntersection
}

export interface SchematicInvalidStringError extends BaseSchematicError {
    type: SchematicErrorType.InvalidString
    received: any
}

export interface SchematicInvalidTypeError extends BaseSchematicError {
    expected: any
    received: any
    type: SchematicErrorType.InvalidType
}

export interface SchematicInvalidUnionError extends BaseSchematicError {
    received: any
    unionErrors: SchematicError[]
    type: SchematicErrorType.InvalidUnion
}

export interface SchematicTooBigError extends BaseSchematicError {
    type: SchematicErrorType.TooBig
    maximum: number | Date
    received: any
}

export interface SchematicTooSmallError extends BaseSchematicError {
    type: SchematicErrorType.TooSmall
    minimum: number | Date
    received: any
}

export interface SchematicUnrecognizedKeysError extends BaseSchematicError {
    keys: Array<string | number>
    type: SchematicErrorType.UnrecognizedKeys
}

export interface SchematicUnrecognizedValueError extends BaseSchematicError {
    expected: Array<string | number>
    received: any
    type: SchematicErrorType.UnrecognizedValue
}

export interface SchematicValidationError extends BaseSchematicError {
    params?: { [key: string]: any }
    type: SchematicErrorType.ValidationError
}

export type SchematicErrorWithoutMessage =
    | SchematicInvalidExactValueError
    | SchematicInvalidIntersectionError
    | SchematicInvalidStringError
    | SchematicInvalidTypeError
    | SchematicInvalidUnionError
    | SchematicTooBigError
    | SchematicTooSmallError
    | SchematicUnrecognizedKeysError
    | SchematicUnrecognizedValueError
    | SchematicValidationError

export type SchematicError = SchematicErrorWithoutMessage & {
    fatal?: boolean
    message: string
}

export type SchematicErrorData = RemovePath<SchematicErrorWithoutMessage> & {
    path?: (string | number)[]
}

export type SchematicTestError = Partial<Omit<SchematicError, "type">>

/**
 * Input data when running a Schematic validation
 */
export type SchematicInput<T = any> = {
    value: T
    path: (string | number)[]
    parent: SchematicContext
}

export interface SchematicParseResult {
    status: "valid" | "invalid" | "dirty"
    data: any
}

export type INVALID = { status: "invalid" }
export const INVALID: INVALID = Object.freeze({ status: "invalid" })
export const NEVER = INVALID as never

export type DIRTY<T> = { status: "dirty"; value: T }
export const DIRTY = <T>(value: T): DIRTY<T> => ({ status: "dirty", value })

export type VALID<T> = { status: "valid"; value: T }
export const VALID = <T>(value: T): VALID<T> => ({ status: "valid", value })

export type SchematicParseReturnType<T = any> = VALID<T> | DIRTY<T> | INVALID

export const isInvalid = (result: SchematicParseReturnType<any>): result is INVALID =>
    result.status === "invalid"
export const isDirty = <T>(result: SchematicParseReturnType<T>): result is DIRTY<T> =>
    result.status === "dirty"
export const isValid = <T>(result: SchematicParseReturnType<T>): result is VALID<T> =>
    result.status === "valid"

// #endregion

type UnionToIntersectionFn<T> = (T extends unknown ? (k: () => T) => void : never) extends (
    k: infer Intersection
) => void
    ? Intersection
    : never

type GetUnionLast<T> = UnionToIntersectionFn<T> extends () => infer Last ? Last : never

type UnionToTuple<T, Tuple extends unknown[] = []> = [T] extends [never]
    ? Tuple
    : UnionToTuple<Exclude<T, GetUnionLast<T>>, [GetUnionLast<T>, ...Tuple]>

type CastToStringTuple<T> = T extends [string, ...string[]] ? T : never

export type UnionToTupleString<T> = CastToStringTuple<UnionToTuple<T>>
