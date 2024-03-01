import { describe, expect, test } from "@jest/globals"

import { SchematicErrorType, type Infer } from "../types"

import { assertEqual } from "../util"
import { SchematicParseError } from "../error"
import { UnknownKeys } from "../object"
import * as schematic from "../"

describe("boolean", () => {
    test("type inference should be correct", () => {
        const schema = schematic.boolean()

        assertEqual<Infer<typeof schema>, boolean>(true)
    })

    test("should parse a boolean value", async () => {
        const schema = schematic.boolean()

        const result = await schema.parse(true)

        await expect(result).toBe(true)
    })

    test("should throw an error if the value is not a boolean", async () => {
        const schema = schematic.boolean()

        try {
            await schema.parse("true")
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeInstanceOf(SchematicParseError)
            const verifyError = error as SchematicParseError
            expect(verifyError.errors).toHaveLength(1)
            expect(verifyError.errors[0].type).toEqual(SchematicErrorType.InvalidType)
        }
    })
})

describe("enum", () => {
    enum TestEnum {
        A = "a",
        B = "b"
    }

    test("type inference should be correct", () => {
        const schema = schematic.enum(TestEnum)

        assertEqual<Infer<typeof schema>, TestEnum>(true)
    })

    test("should parse a valid enum value", async () => {
        const schema = schematic.enum(TestEnum)

        const result = await schema.parse("a")

        expect(result).toBe("a")
    })

    test("should throw an error if the value is not a valid enum value", async () => {
        const schema = schematic.enum(TestEnum)

        try {
            await schema.parse("c")
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeInstanceOf(SchematicParseError)
            const verifyError = error as SchematicParseError
            expect(verifyError.errors).toHaveLength(1)
            expect(verifyError.errors[0].type).toEqual(SchematicErrorType.UnrecognizedValue)
        }
    })
})

describe("number", () => {
    test("type inference should be correct", () => {
        const schema = schematic.number()

        assertEqual<Infer<typeof schema>, number>(true)
    })

    test("should parse a number value", async () => {
        const schema = schematic.number()

        const result = await schema.parse(42)

        expect(result).toBe(42)
    })
})

describe("object", () => {
    it("should parse an object", async () => {
        const schema = schematic.object({
            isValid: schematic.boolean(),
            nested: schematic.object({
                isError: schematic.boolean()
            })
        })

        const result = await schema.parse({
            isValid: true,
            nested: {
                isError: false
            }
        })

        expect(result).toEqual({
            isValid: true,
            nested: {
                isError: false
            }
        })
    })

    it('should allow unknown keys if "unknownKeys" is set to "allow"', async () => {
        const schema = schematic.object({
            isValid: schematic.boolean(),
            nested: schematic.object(
                {
                    isError: schematic.boolean()
                },
                {
                    unknownKeys: UnknownKeys.Allow
                }
            )
        })

        const result = await schema.parse({
            isValid: true,
            nested: {
                isError: false,
                extra: "key"
            }
        })

        expect(result).toEqual({
            isValid: true,
            nested: {
                isError: false,
                extra: "key"
            }
        })
    })

    it('should reject unknown keys if "unknownKeys" is set to "reject"', async () => {
        const schema = schematic.object(
            {
                isValid: schematic.boolean()
            },
            {
                unknownKeys: UnknownKeys.Reject
            }
        )

        try {
            await schema.parse({
                isValid: true,
                extra: "key"
            })
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeInstanceOf(SchematicParseError)
            const verifyError = error as SchematicParseError
            expect(verifyError.errors).toHaveLength(1)
            expect(verifyError.errors[0].type).toEqual(SchematicErrorType.UnrecognizedKey)
        }
    })

    it("should throw an error if the value is not an object", async () => {
        const schema = schematic.object({
            isValid: schematic.boolean(),
            nested: schematic.object({
                isError: schematic.boolean()
            })
        })

        try {
            await schema.parse({
                isValid: true,
                nested: {
                    isError: "false"
                }
            })
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeInstanceOf(SchematicParseError)
            const verifyError = error as SchematicParseError
            expect(verifyError.errors).toHaveLength(1)
            expect(verifyError.errors[0].type).toEqual(SchematicErrorType.InvalidType)
        }
    })

    it("should allow optional keys", async () => {
        const schema = schematic.object({
            isValid: schematic.boolean(),
            nested: schematic.object({
                isError: schematic.boolean()
            }),
            optional: schematic.object({
                isOptional: schematic.boolean().optional()
            })
        })

        const result = await schema.parse({
            isValid: true,
            nested: {
                isError: false
            },
            optional: {}
        })

        expect(result).toEqual({
            isValid: true,
            nested: {
                isError: false
            },
            optional: {}
        })
    })

    it("should allow omitting keys and correctly validating those", async () => {
        const base = schematic.object({
            foo: schematic.string(),
            bar: schematic.number(),
            baz: schematic.boolean().optional()
        })

        const schema = base.omit("foo")

        const result = await schema.parse({
            bar: 42
        })

        expect(result).toEqual({
            bar: 42
        })
    })

    it("should allow picking keys and correctly validating those", async () => {
        const base = schematic.object({
            foo: schematic.string(),
            bar: schematic.number(),
            baz: schematic.boolean().optional()
        })

        const schema = base.pick("foo", "baz")

        const result = await schema.parse({
            foo: "test"
        })

        expect(result).toEqual({
            foo: "test"
        })
    })
})

describe("string", () => {
    test("type inference should be correct", () => {
        const schema = schematic.string()

        assertEqual<Infer<typeof schema>, string>(true)
    })

    test("should parse a string value", async () => {
        const schema = schematic.string()

        const result = await schema.parse("hello")

        expect(result).toBe("hello")
    })
})
