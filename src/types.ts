import { Schematic } from "./schematic"

/**
 * A Schematic of any type
 */
export type AnySchematic = Schematic<any>
export type AssertEqual<Type, Expected> = Type extends Expected ? true : false

type Eval<Type> = Type extends any[] | Date | unknown ? Type : Flat<Type>
type Flat<Type> = Type extends {}
    ? Type extends Date
        ? Type
        : { [key in keyof Type]: Type[key] }
    : Type

export type EnumType = { [key: string]: string | number; [num: number]: string }
export type Infer<T> = T extends AnySchematic ? (T extends Schematic<infer U> ? U : any) : T
export type InferObject<T extends SchematicObjectShape> = Flat<
    Eval<{
        [key in keyof T]: T[key] extends Schematic<infer U> ? U : any
    }>
>
export type SchematicOmit<T, K extends keyof T> = Eval<Flat<Omit<T, K>>>
export type SchematicPick<T, K extends keyof T> = Eval<Flat<Pick<T, K>>>

export const INVALID = <T>(errors: SchematicError[]): SchematicParseResult<T> => ({
    errors,
    isValid: false
})
export const VALID = <T>(value: T): SchematicParseResult<T> => ({ isValid: true, value })

export interface SchematicContext {
    readonly data: any
    readonly path: (string | number)[]
    readonly parent: SchematicContext | null
}

export enum SchematicErrorType {
    InvalidExactValue = "InvalidExactValue",
    InvalidType = "InvalidType",
    TooBig = "TooBig",
    TooSmall = "TooSmall",
    UnrecognizedKey = "UnrecognizedKey",
    UnrecognizedValue = "UnrecognizedValue"
}

interface BaseSchematicError {
    message: string
    path: (string | number)[]
}

export type SchematicInvalidExactValueError = BaseSchematicError & {
    type: SchematicErrorType.InvalidExactValue
    expected: any
}

export type SchematicInvalidTypeError = BaseSchematicError & {
    type: SchematicErrorType.InvalidType
}

export type SchematicTooBigError = BaseSchematicError & {
    type: SchematicErrorType.TooBig
    max: number
}

export type SchematicTooSmallError = BaseSchematicError & {
    type: SchematicErrorType.TooSmall
    min: number
}

export type SchematicUnrecognizedKeyError = BaseSchematicError & {
    key: string
    type: SchematicErrorType.UnrecognizedKey
}

export type SchematicUnrecognizedValueError = BaseSchematicError & {
    expected: Array<string | number>
    type: SchematicErrorType.UnrecognizedValue
}

export type SchematicError =
    | SchematicInvalidExactValueError
    | SchematicInvalidTypeError
    | SchematicTooBigError
    | SchematicTooSmallError
    | SchematicUnrecognizedKeyError
    | SchematicUnrecognizedValueError

export type SchematicObjectShape = {
    [key: string]: AnySchematic
}

type SchematicParseFailure = {
    errors: SchematicError[]
    isValid: false
}

type SchematicParseSuccess<T> = {
    isValid: true
    value: T
}

export type SchematicParseResult<T> = SchematicParseFailure | SchematicParseSuccess<T>
