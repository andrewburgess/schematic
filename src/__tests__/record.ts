import * as schematic from "../"

describe("record", () => {
    it("should parse a record", async () => {
        const schema = schematic.record(schematic.string())

        const result = await schema.parse({ foo: "bar" })

        expect(result).toEqual({ foo: "bar" })
    })

    it("should throw an error if the value is not a record", async () => {
        const schema = schematic.record(schematic.string())

        try {
            await schema.parse(123)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected object but received number")
        }
    })

    it("should throw an error if a value in the record is invalid", async () => {
        const schema = schematic.record(schematic.string())

        try {
            await schema.parse({ foo: 123 })
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected string but received number")
        }
    })

    it("should throw an error if a key in the record is invalid", async () => {
        const schema = schematic.record(schematic.string().length(5), schematic.number())

        try {
            await schema.parse({ toolong: 123 })
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe(
                "Expected string with length 5 but received string with length 7"
            )
        }
    })

    it("should allow complex value schema", async () => {
        const schema = schematic.record(
            schematic.string(),
            schematic.object({ foo: schematic.number(), bar: schematic.boolean().optional() })
        )

        const result = await schema.parse({ bar: { foo: 123 } })

        expect(result).toEqual({ bar: { foo: 123 } })
    })
})
