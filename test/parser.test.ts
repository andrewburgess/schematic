import assert from "assert"
import * as schematic from "../src/index"

describe("Parser", () => {
    describe("object", () => {
        it("should parse an object", async () => {
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
            assert(result.name === "John")
            assert(result.age === 17)
            assert(result.address.street === "123 Fake St")
        })

        it("should strip unknown keys", async () => {
            const schema = schematic.object({
                age: schematic.number()
            })

            const result = await schema.parse({
                age: 17,
                name: "John"
            })

            assert(result.age === 17)
            assert(!("name" in result))
        })

        it("should allow unknown keys", async () => {
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

            assert(result.age === 17)
            assert.strictEqual((result as any).name, "John")
        })
    })

    describe("string", () => {
        it("should parse a string", async () => {
            const schema = schematic.string()

            const result = await schema.parse("hello")
            assert(result === "hello")
        })
    })
})
