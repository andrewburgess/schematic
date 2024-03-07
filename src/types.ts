import { AnyValueSchematic, NullableSchematic, OptionalSchematic, Schematic } from "./schematic"

// #region Utility Types
export type OmitKeys<T, K extends string> = Pick<T, Exclude<keyof T, K>>
// #endregion

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
export interface SchematicContext {
    readonly data: any
    readonly path: (string | number)[]
    readonly parent?: SchematicContext | null
    readonly root: {
        readonly errors: SchematicError[]
    }
}

export interface SchematicTestContext {
    addError: (error: SchematicErrorData) => void
    path: (string | number)[]
}

export type TransformFn<TSchematic, TOutput> = (
    value: Infer<TSchematic>,
    context: SchematicTestContext
) => TOutput | Promise<TOutput>

export type ValidationCheck<TValue> = (
    value: TValue,
    context: SchematicTestContext
) => Promise<void> | void

export type TestCheck<TValue> = (value: TValue) => Promise<boolean> | boolean

export enum SchematicErrorType {
    InvalidExactValue = "InvalidExactValue",
    InvalidIntersection = "InvalidIntersection",
    InvalidString = "InvalidString",
    InvalidType = "InvalidType",
    InvalidUnion = "InvalidUnion",
    TooBig = "TooBig",
    TooSmall = "TooSmall",
    UnrecognizedKeys = "UnrecognizedKeys",
    UnrecognizedValue = "UnrecognizedValue",
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

type RemovePath<T extends object> = T extends any ? OmitKeys<T, "path"> : never
export type SchematicErrorData = RemovePath<SchematicErrorWithoutMessage> & {
    path?: (string | number)[]
}

export type SchematicInput<T = any> = {
    value: T
    path: (string | number)[]
    parent: SchematicContext
}

export class SchematicInputChild implements SchematicInput {
    public parent: SchematicContext
    public value: any
    private _path: (string | number)[]
    private _key: string | number | (string | number)[]
    private _cachedPath: (string | number)[] = []

    constructor(
        parent: SchematicContext,
        value: any,
        path: (string | number)[],
        key: string | number | (string | number)[]
    ) {
        this.parent = parent
        this.value = value
        this._path = path
        this._key = key
    }

    public get path() {
        if (!this._cachedPath.length) {
            if (this._key instanceof Array) {
                this._cachedPath = [...this._path, ...this._key]
            } else {
                this._cachedPath = [...this._path, this._key]
            }
        }

        return this._cachedPath
    }
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
    [key in keyof T]: T[key] extends OptionalSchematic<any>
        ? key
        : T[key] extends AnyValueSchematic
          ? key
          : never
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

type RemoveOptional<T> = T extends OptionalSchematic<infer U> ? RemoveOptional<U> : T

export type SchematicRequired<T extends SchematicObjectShape, K extends keyof T> = Flatten<
    {
        [key in Extract<keyof T, K>]: T[key] extends OptionalSchematic<any>
            ? RemoveOptional<T[key]["shape"]>
            : T[key] extends NullableSchematic<any>
              ? NullableSchematic<RemoveOptional<T[key]["shape"]>>
              : T[key]
    } & Pick<T, Exclude<keyof T, K>>
>

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
