import { describe, expect, test } from "@jest/globals"

import * as schematic from "../"
import { ValidationError } from "../errors"

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
