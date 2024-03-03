import * as schematic from "../"

describe("string", () => {
    const schema = schematic.string()

    it("should parse a string", async () => {
        const result = await schema.parse("foo")

        expect(result).toBe("foo")
    })

    it("should throw an error if the value is not a string", async () => {
        try {
            await schema.parse(123)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected string but received number")
        }
    })

    it("should allow setting a default value", async () => {
        const result = await schema.default("default").parse(undefined)

        expect(result).toBe("default")
    })

    it("should allow setting a default value with a function", async () => {
        const result = await schema.default(() => "default").parse(undefined)

        expect(result).toBe("default")
    })

    it("should fail with null even with empty string as default", async () => {
        try {
            await schema.default("").parse(null)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected string but received null")
        }
    })

    it("should allow coercion of values", async () => {
        await Promise.all([
            expect(schema.coerce().parse(42)).resolves.toBe("42"),
            expect(schema.coerce().parse(1.23)).resolves.toBe("1.23"),
            expect(schema.coerce().parse(true)).resolves.toBe("true"),
            expect(schema.coerce().parse(false)).resolves.toBe("false"),
            expect(schema.coerce().parse(null)).resolves.toBe("null"),
            expect(schema.coerce().parse(new Date(10))).resolves.toBeDefined(),
            expect(schema.coerce().parse(undefined)).resolves.toBe("")
        ])
    })

    it("should reject invalid coercions", async () => {
        await Promise.all([
            expect(schema.coerce().parse({})).rejects.toThrow(
                "Expected string but received object"
            ),
            expect(schema.coerce().parse(Symbol())).rejects.toThrow(
                "Expected string but received symbol"
            ),
            expect(schema.coerce().parse(() => "invalid")).rejects.toThrow(
                "Expected string but received function"
            )
        ])
    })

    it("should allow setting a length", async () => {
        const result = await schema.length(3).parse("foo")

        expect(result).toBe("foo")
    })

    it("should fail if the length is incorrect", async () => {
        try {
            await schema.length(3).parse("foobar")
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe(
                "Expected string with length 3 but received string with length 6"
            )
        }
    })
})
