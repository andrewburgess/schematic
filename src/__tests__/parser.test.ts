import { describe, expect, test } from "@jest/globals"

import * as schematic from "../"
import { ValidationError } from "../errors"

describe("boolean", () => {
    test("parse boolean", async () => {
        const schema = schematic.boolean()
        const result = await schema.parse(true)
        expect(result).toBe(true)
    })

    test("boolean should reject invalid value", async () => {
        const schema = schematic.boolean()
        try {
            await schema.parse(1)
        } catch (error) {
            if (error instanceof ValidationError) {
                expect(error.message).toEqual(
                    "expected value to be of type 'boolean' but got 'number'"
                )
            }
        }
    })

    test("can intersect with another schema", async () => {
        const schema = schematic.boolean().and(schematic.boolean())
        const result = await schema.parse(true)
        expect(result).toBe(true)
    })

    test("can set a default value", async () => {
        const schema = schematic.boolean().default(true)
        const result = await schema.parse(undefined)
        expect(result).toBe(true)
    })
})

describe("number", () => {
    test("parse number", async () => {
        const schema = schematic.number()
        const result = await schema.parse(10)
        expect(result).toBe(10)
    })
})

describe("object", () => {
    test("parse an object", async () => {
        const schema = schematic.object({
            /**
             * How old the person is
             */
            age: schematic.number(),
            /**
             * Name of the person
             */
            name: schematic.string(),

            address: schematic.object({
                street: schematic.string()
            })
        })

        const result = await schema.parse({
            age: 17,
            name: "John",
            address: {
                street: "123 Fake St"
            }
        })

        expect(result.name).toBe("John")
        expect(result.age).toBe(17)
        expect(result.address.street).toBe("123 Fake St")
    })

    test("strip unknown keys", async () => {
        const schema = schematic.object({
            age: schematic.number()
        })

        const result = await schema.parse({
            age: 17,
            name: "John"
        })

        expect(result.age).toBe(17)
        expect("name" in result).toBe(false)
    })

    test("allow unknown keys", async () => {
        const schema = schematic.object(
            {
                age: schematic.number()
            },
            { allowUnknown: true }
        )

        const result = await schema.parse({
            age: 17,
            name: "John"
        })

        expect(result.age).toBe(17)
        expect((result as any).name).toBe("John")
    })

    test("combine objects with and", async () => {
        const nameSchema = schematic.object({
            /**
             * Name of the person
             */
            name: schematic.string()
        })
        const ageSchema = schematic.object({
            /**
             * How old the person is
             */
            age: schematic.number()
        })

        const schema = nameSchema.and(ageSchema)

        const result = await schema.parse({
            age: 17,
            name: "John"
        })

        expect(result.age).toBe(17)
        expect(result.name).toBe("John")
    })
})

describe("record", () => {
    test("parse record", async () => {
        const schema = schematic.record(schematic.string(), schematic.number())
        const result = await schema.parse({ "1": 1, "2": 2 })
        expect(result).toEqual({ "1": 1, "2": 2 })
    })

    test("record should reject invalid value", async () => {
        const schema = schematic.record(schematic.string(), schematic.number())
        try {
            await schema.parse({ "1": "1", "2": 2 })
        } catch (error) {
            if (error instanceof ValidationError) {
                expect(error.message).toBe(
                    "error parsing '1': expected value to be of type 'number' but got 'string'"
                )
            }
        }
    })
})

describe("string", () => {
    test("parse string", async () => {
        const schema = schematic.string()
        const result = await schema.parse("hello")
        expect(result).toBe("hello")
    })
})
