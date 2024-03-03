import * as schematic from "../"

describe("boolean", () => {
    const schema = schematic.boolean()

    it("should parse a boolean", async () => {
        const result = await schema.parse(true)

        expect(result).toBe(true)
    })

    it("should throw an error if the value is not a boolean", async () => {
        try {
            await schema.parse(1)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected boolean but received number")
        }
    })

    it("should allow setting a default value", async () => {
        const result = await schema.default(true).parse(undefined)

        expect(result).toBe(true)
    })

    it("should allow setting a default value with a function", async () => {
        const result = await schema.default(() => true).parse(undefined)

        expect(result).toBe(true)
    })

    it("should fail with null even with false as default", async () => {
        try {
            await schema.default(false).parse(null)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected boolean but received null")
        }
    })

    it("should allow coercion of values", async () => {
        await Promise.all([
            expect(schema.coerce().parse("true")).resolves.toBe(true),
            expect(schema.coerce().parse("false")).resolves.toBe(false),
            expect(schema.coerce().parse("TRUE")).resolves.toBe(true),
            expect(schema.coerce().parse("FALSE")).resolves.toBe(false),
            expect(schema.coerce().parse(1)).resolves.toBe(true),
            expect(schema.coerce().parse(0)).resolves.toBe(false)
        ])
    })

    it("should reject invalid coercions", async () => {
        await Promise.all([
            expect(schema.coerce().parse("invalid")).rejects.toThrow(
                "Expected boolean but received string"
            ),
            expect(schema.coerce().parse({})).rejects.toThrow(
                "Expected boolean but received object"
            ),
            expect(schema.coerce().parse(null)).rejects.toThrow(
                "Expected boolean but received null"
            ),
            expect(schema.coerce().parse(undefined)).rejects.toThrow(
                "Expected boolean but received undefined"
            ),
            expect(schema.coerce().parse(NaN)).rejects.toThrow(
                "Expected boolean but received number"
            ),
            expect(schema.coerce().parse(Infinity)).rejects.toThrow(
                "Expected boolean but received number"
            ),
            expect(schema.coerce().parse(-Infinity)).rejects.toThrow(
                "Expected boolean but received number"
            )
        ])
    })
})
