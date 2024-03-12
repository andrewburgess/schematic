import { BooleanSchematic } from "./boolean"
import { DateSchematic } from "./date"
import { EnumSchematic } from "./enum"
import {
    AnySchematic,
    EnumType,
    Infer,
    SchematicContext,
    SchematicError,
    SchematicInvalidExactValueError,
    SchematicInvalidIntersectionError,
    SchematicInvalidStringError,
    SchematicInvalidTypeError,
    SchematicInvalidUnionError,
    SchematicObjectShape,
    SchematicOptions,
    SchematicTestContext,
    SchematicTooBigError,
    SchematicTooSmallError,
    SchematicUnrecognizedKeysError,
    SchematicUnrecognizedValueError,
    SchematicValidationError
} from "./types"
import { NumberSchematic } from "./number"
import { ObjectSchematic, SchematicObjectOptions, UnknownKeys } from "./object"
import { RecordSchematic } from "./record"
import {
    AnyValueSchematic,
    ArraySchematic,
    IntersectionSchematic,
    LiteralSchematic,
    NullableSchematic,
    OptionalSchematic,
    Schematic,
    UnionSchematic
} from "./schematic"
import { StringSchematic } from "./string"

export type {
    AnySchematic,
    AnyValueSchematic,
    ArraySchematic,
    BooleanSchematic,
    DateSchematic,
    EnumSchematic,
    Infer,
    IntersectionSchematic,
    LiteralSchematic,
    NullableSchematic,
    NumberSchematic,
    ObjectSchematic,
    OptionalSchematic,
    RecordSchematic,
    Schematic,
    SchematicContext,
    SchematicError,
    SchematicInvalidExactValueError,
    SchematicInvalidIntersectionError,
    SchematicInvalidStringError,
    SchematicInvalidTypeError,
    SchematicInvalidUnionError,
    SchematicObjectOptions,
    SchematicTestContext,
    SchematicTooBigError,
    SchematicTooSmallError,
    SchematicUnrecognizedKeysError,
    SchematicUnrecognizedValueError,
    SchematicValidationError,
    StringSchematic,
    UnionSchematic,
    UnknownKeys
}

export { SchematicParseError } from "./error"
export { NEVER, SchematicErrorType } from "./types"

/**
 * Creates a validator the ensures a value is one of the provided enumeration values.
 * @param enumeration Enumeration values to validate against
 * @returns Validator of an Enum type
 */
const enumeration = <T extends EnumType>(enumeration: T) => new EnumSchematic(enumeration)
export { enumeration as enum }
/**
 * Creates a validator that allows any value
 * @returns Validator of an Any type
 */
export const any = () => new AnyValueSchematic()
/**
 * Creates a validator that checks for an array, and then validates each of the elements of the array
 * based on the provided `shape`.
 * @param shape Schematic to validate elements of the Array
 * @returns Validator of an Array type
 */
export const array = <T extends AnySchematic>(shape: T) => new ArraySchematic(shape)
/**
 * Creates a validator that ensures a value is a boolean.
 * @param opts Configuration options for boolean validation
 * @returns Validator of a Boolean type
 */
export const boolean = (opts?: SchematicOptions) => new BooleanSchematic(opts)
/**
 * Creates a validator that ensures a value is a date.
 * @param opts Configuration options for date validation
 * @returns Validator of a Date type
 */
export const date = (opts?: SchematicOptions) => new DateSchematic(opts)
/**
 * Creates a validator that checks a value is valid for _both_ the `left` and `right` validators.
 * @param left The first validator to intersect
 * @param right The second validator to intersect
 * @returns Validator of an Intersection type
 */
export const intersection = <TLeft extends AnySchematic, TRight extends AnySchematic>(
    left: TLeft,
    right: TRight
) => new IntersectionSchematic(left, right)
/**
 * Creates a validator that ensures a value is a specific literal value.
 * @param value Exact value to check against
 * @returns Validator of a Literal type
 */
export const literal = <T extends string | number | boolean>(value: T) =>
    new LiteralSchematic(value)
/**
 * Creates a validator that ensures a value is a number.
 * @param opts Configuration options for number validation
 * @returns Validator of a Number type
 */
export const number = (opts?: SchematicOptions) => new NumberSchematic(opts)
/**
 * Creates a validator that ensures the shape of an object is valid based on the provided `shape`.
 * @param shape The shape of the object to be validated
 * @param opts Configuration options for object validation
 * @returns Validator of an Object type
 */
export const object = <T extends SchematicObjectShape>(shape: T, opts?: SchematicObjectOptions) =>
    new ObjectSchematic(shape, opts)
/**
 * Creates a validator that can validate the keys and values of a record.
 * @param keySchema Schema to validate the keys of the record
 * @param valueSchema Schema to validate the values of the record
 * @param opts Configuration options for record validation
 * @returns Validator of a Record type
 */
export function record<TKey extends StringSchematic, TValue>(
    keySchema: TKey,
    valueSchema: Schematic<TValue>,
    opts?: SchematicOptions
): RecordSchematic<TKey, TValue>
/**
 * Creates a validator that can validate values of a record. Defaults to using a string for the keys.
 * @param valueSchema Schema to validate the values of the record
 * @param opts Configuration options for record validation
 * @returns Validator of a Record type
 */
export function record<TValue>(
    valueSchema: Schematic<TValue>,
    opts?: SchematicOptions
): RecordSchematic<StringSchematic, TValue>
export function record() {
    let [keySchema, valueSchema, options] = Array.from(arguments)
    if (keySchema instanceof StringSchematic && valueSchema instanceof Schematic) {
        return new RecordSchematic(keySchema, valueSchema, options)
    } else {
        return new RecordSchematic(string(), keySchema, valueSchema)
    }
}
/**
 * Creates a validator that ensures a value is a string.
 * @param opts Configuration options for string validation
 * @returns Validator of a String type
 */
export const string = (opts?: SchematicOptions) => new StringSchematic(opts)
/**
 * Creates a validator that ensures the value matches at least _one_ of the provided schemas.
 * @param schemas All of the schemas to check against
 * @returns Validator of a Union type
 */
export const union = <T extends [AnySchematic, ...AnySchematic[]]>(...schemas: T) =>
    new UnionSchematic(schemas)
