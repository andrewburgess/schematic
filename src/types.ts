import { Schematic } from "./schematic"

/**
 * A Schematic of any type
 */
export type AnySchematic = Schematic<any>
export type AssertEqual<T, Expected> = T extends Expected ? true : false

type AddQuestionMarks<T extends object, K extends keyof T = RequiredKeys<T>> = Pick<
    Required<T>,
    K
> &
    Partial<T>
type Eval<T> = T extends any[] | Date | unknown ? T : Flat<T>
type Flat<T> = T extends {}
    ? T extends Date
        ? T
        : AddQuestionMarks<{ [key in keyof T]: T[key] }>
    : T
type RequiredKeys<T extends object> = {
    [key in keyof T]: undefined extends T[key] ? never : key
}[keyof T]

export type Infer<T> = T extends AnySchematic ? (T extends Schematic<infer U> ? U : any) : T
export type InferObject<T extends SchematicObjectShape> = Eval<{
    [key in keyof T]: T[key] extends Schematic<infer U> ? U : any
}>

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
    UnrecognizedKey = "UnrecognizedKey"
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

export type SchematicError =
    | SchematicInvalidExactValueError
    | SchematicInvalidTypeError
    | SchematicTooBigError
    | SchematicTooSmallError
    | SchematicUnrecognizedKeyError

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
