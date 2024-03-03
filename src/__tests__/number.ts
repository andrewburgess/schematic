import * as schematic from "../"

describe("number", () => {
    const schema = schematic.number()

    test("should parse a number", async () => {
        const result = await schema.parse(10)

        expect(result).toBe(10)
    })

    test("should throw an error if the value is not a number", async () => {
        try {
            await schema.parse(true)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected number but received boolean")
        }
    })

    test("should allow setting a default value", async () => {
        const result = await schema.default(42).parse(undefined)

        expect(result).toBe(42)
    })

    test("should allow setting a default value with a function", async () => {
        const result = await schema.default(() => 42).parse(undefined)

        expect(result).toBe(42)
    })

    test("should fail with null even with 0 as default", async () => {
        try {
            await schema.default(0).parse(null)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected number but received object")
        }
    })

    test("should allow coercion of values", async () => {
        await Promise.all([
            expect(schema.coerce().parse("42")).resolves.toBe(42),
            expect(schema.coerce().parse("1.23")).resolves.toBe(1.23),
            expect(schema.coerce().parse(true)).resolves.toBe(1),
            expect(schema.coerce().parse(false)).resolves.toBe(0),
            expect(schema.coerce().parse(null)).resolves.toBe(0),
            expect(schema.coerce().parse(new Date(10))).resolves.toBe(10)
        ])
    })

    test("should reject invalid coercions", async () => {
        await Promise.all([
            expect(schema.coerce().parse("invalid")).rejects.toThrow(
                "Expected number but received string"
            ),
            expect(schema.coerce().parse({})).rejects.toThrow(
                "Expected number but received object"
            ),
            expect(schema.coerce().parse(undefined)).rejects.toThrow(
                "Expected number but received undefined"
            )
        ])
    })

    test("should allow setting a maximum value", async () => {
        const result = await schema.max(10).parse(10)

        expect(result).toBe(10)
    })

    test("should throw an error if the value is greater than the maximum", async () => {
        try {
            await schema.max(10).parse(11)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected value less than or equal to 10 but received 11")
        }
    })

    test("should throw an error if the value is greater than the exclusive maximum", async () => {
        try {
            await schema.max(10, { exclusive: true }).parse(10)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected value less than 10 but received 10")
        }
    })

    test("should allow setting a minimum value", async () => {
        const result = await schema.min(10).parse(10)

        expect(result).toBe(10)
    })

    test("should throw an error if the value is less than the minimum", async () => {
        try {
            await schema.min(10).parse(9)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected value greater than or equal to 10 but received 9")
        }
    })

    test("should throw an error if the value is less than the exclusive minimum", async () => {
        try {
            await schema.min(10, { exclusive: true }).parse(10)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected value greater than 10 but received 10")
        }
    })
})
