import { Schematic } from "./schematic"

/**
 * A Schematic of any type
 */
export type AnySchematic = Schematic<any>
export type AssertEqual<T, Expected> = T extends Expected ? true : false
type Flat<T> = T extends {} ? (T extends Date ? T : { [key in keyof T]: T[key] }) : T

export type Infer<T> = T extends AnySchematic ? (T extends Schematic<infer K> ? K : any) : T
export type InferObject<T extends SchematicObjectShape> = Flat<{
    [key in keyof T]: T[key] extends Schematic<infer U> ? U : never
}>

export interface SchematicContext {
    readonly data: any
    readonly path: (string | number)[]
    readonly parent: SchematicContext | null
}

export enum SchematicErrorType {
    InvalidType = "InvalidType",
    UnrecognizedKey = "UnrecognizedKey"
}

interface BaseSchematicError {
    message: string
    path: (string | number)[]
}

export type SchematicInvalidTypeError = BaseSchematicError & {
    type: SchematicErrorType.InvalidType
}

export type SchematicUnrecognizedKeyError = BaseSchematicError & {
    key: string
    type: SchematicErrorType.UnrecognizedKey
}

export type SchematicError = SchematicInvalidTypeError | SchematicUnrecognizedKeyError

export type SchematicObjectShape = { [key: string]: AnySchematic }

type SchematicParseFailure = {
    errors: SchematicError[]
    isValid: false
}

type SchematicParseSuccess<T> = {
    isValid: true
    value: T
}

export type SchematicParseResult<T> = SchematicParseFailure | SchematicParseSuccess<T>
