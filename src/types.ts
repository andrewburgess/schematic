import { NullableSchematic, OptionalSchematic, Schematic } from "./schematic"

// #region Schematic Symbols
export const CoerceSymbol = Symbol("coerce")
export const DefaultValueSymbol = Symbol("defaultValue")
export const KeySchemaSymbol = Symbol("keySchema")
export const OutputSymbol = Symbol("output")
export const ShapeSymbol = Symbol("shape")
export const TypeErrorSymbol = Symbol("typeErrorMessage")
export const ValueSchemaSymbol = Symbol("valueSchema")
// #endregion

// #region Schematic Enhancements
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

export interface Coercable {
    coerce(): AnySchematic
}

export interface Defaultable<TValue> {
    [DefaultValueSymbol]: TValue | (() => TValue) | undefined
    default(value: TValue | (() => TValue)): Schematic<TValue>
}

// #endregion

// #region Schematic Validation
export type TransformFn<TSchematic, TOutput> = (
    value: Infer<TSchematic>,
    context: SchematicTestContext
) => TOutput | Promise<TOutput>

export type ValidationCheck<TValue> = (
    value: TValue,
    context: SchematicTestContext
) => Promise<void> | void

export type TestCheck<TValue> = (value: TValue) => Promise<boolean> | boolean

export const INVALID = <T>(errors: SchematicError | SchematicError[]): SchematicParseResult<T> => ({
    errors: Array.isArray(errors) ? errors : [errors],
    isValid: false
})
export const VALID = <T>(value: T): SchematicParseResult<T> => ({ isValid: true, value })

export const NEVER = INVALID as never

export enum SchematicErrorType {
    InvalidExactValue = "InvalidExactValue",
    InvalidIntersection = "InvalidIntersection",
    InvalidString = "InvalidString",
    InvalidType = "InvalidType",
    InvalidUnion = "InvalidUnion",
    TooBig = "TooBig",
    TooSmall = "TooSmall",
    UnrecognizedKey = "UnrecognizedKey",
    UnrecognizedValue = "UnrecognizedValue",
    ValidationError = "ValidationError"
}

interface BaseSchematicError {
    message: string
    path?: (string | number)[]
}

export type SchematicInvalidExactValueError = BaseSchematicError & {
    type: SchematicErrorType.InvalidExactValue
    expected: any
    received: any
}

export type SchematicInvalidIntersectionError = BaseSchematicError & {
    errors: SchematicError[]
    received: any
    type: SchematicErrorType.InvalidIntersection
}

export type SchematicInvalidStringError = BaseSchematicError & {
    type: SchematicErrorType.InvalidString
    received: any
}

export type SchematicInvalidTypeError = BaseSchematicError & {
    received: any
    type: SchematicErrorType.InvalidType
}

export type SchematicInvalidUnionError = BaseSchematicError & {
    errors: SchematicError[]
    received: any
    type: SchematicErrorType.InvalidUnion
}

export type SchematicTooBigError = BaseSchematicError & {
    type: SchematicErrorType.TooBig
    max: number | Date
    received: any
}

export type SchematicTooSmallError = BaseSchematicError & {
    type: SchematicErrorType.TooSmall
    min: number | Date
    received: any
}

export type SchematicUnrecognizedKeyError = BaseSchematicError & {
    key: string
    type: SchematicErrorType.UnrecognizedKey
}

export type SchematicUnrecognizedValueError = BaseSchematicError & {
    expected: Array<string | number>
    received: any
    type: SchematicErrorType.UnrecognizedValue
}

export type SchematicValidationError = BaseSchematicError & {
    type: SchematicErrorType.ValidationError
}

export type SchematicError =
    | SchematicInvalidExactValueError
    | SchematicInvalidIntersectionError
    | SchematicInvalidStringError
    | SchematicInvalidTypeError
    | SchematicInvalidUnionError
    | SchematicTooBigError
    | SchematicTooSmallError
    | SchematicUnrecognizedKeyError
    | SchematicUnrecognizedValueError
    | SchematicValidationError

type SchematicParseFailure = {
    errors: SchematicError[]
    isValid: false
}

type SchematicParseSuccess<T> = {
    isValid: true
    value: T
}

export type SchematicParseResult<T> = SchematicParseFailure | SchematicParseSuccess<T>
// #endregion

// #region Schematic Type Testing
export type AssertEqual<Type, Expected> = Type extends Expected ? true : false
// #endregion

/**
 * A Schematic of any type
 */
export type AnySchematic = Schematic<any>

export type EnumType =
    | { readonly [key: string]: string | number }
    | { readonly [key: number]: string | number }

export type Identity<T> = T
export type Flatten<T> = Identity<{ [key in keyof T]: T[key] }>

type OptionalKeys<T extends SchematicObjectShape> = {
    [key in keyof T]: T[key] extends OptionalSchematic<any> ? key : never
}[keyof T]

type RequiredKeys<T extends SchematicObjectShape> = Exclude<string & keyof T, OptionalKeys<T>>

export type Infer<T> = T extends AnySchematic ? T[typeof OutputSymbol] : never
export type InferObject<T extends SchematicObjectShape> = Flatten<
    {
        [key in RequiredKeys<T>]: T[key][typeof OutputSymbol]
    } & {
        [key in OptionalKeys<T>]?: T[key][typeof OutputSymbol]
    }
>
export type SchematicOmit<T, K extends keyof T> = Flatten<Omit<T, K>>
export type SchematicPick<T, K extends keyof T> = Flatten<Pick<T, K>>

export type SchematicExtend<T, U> = Flatten<Omit<T, keyof U> & U>
export type SchematicPartial<T extends SchematicObjectShape, K extends keyof T> = Flatten<
    {
        [key in Extract<keyof T, K>]: T[key] extends OptionalSchematic<T[key]>
            ? T[key]
            : OptionalSchematic<T[key]>
    } & {
        [key in Exclude<keyof T, K>]: T[key]
    }
>

type RemoveNullableOptional<T> = T extends NullableSchematic<infer U> | OptionalSchematic<infer U>
    ? RemoveNullableOptional<U>
    : T

export type SchematicRequired<T extends SchematicObjectShape, K extends keyof T> = Flatten<
    {
        [key in Extract<keyof T, K>]: T[key] extends OptionalSchematic<any>
            ? RemoveNullableOptional<T[key]["shape"]>
            : T[key] extends NullableSchematic<any>
              ? RemoveNullableOptional<T[key]["shape"]>
              : T[key]
    } & Pick<T, Exclude<keyof T, K>>
>

export interface SchematicContext {
    addError(error: SchematicError): void
    readonly data?: any
    readonly errors: SchematicError[]
    readonly path: (string | number)[]
    readonly parent?: SchematicContext | null
}

export type SchematicTestContext = Pick<SchematicContext, "addError" | "path">

export type SchematicObjectShape = {
    [key: string]: AnySchematic
}

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
