import * as schematic from "../"

test("should parse an object", async () => {
    const schema = schematic.object({
        foo: schematic.string()
    })

    const result = await schema.parse({ foo: "bar" })

    expect(result).toEqual({ foo: "bar" })
})

test("nested schemas should surface errors correctly", async () => {
    const schema = schematic.object({
        foo: schematic.string(),
        bar: schematic.object({
            /** Cool baz number */
            baz: schematic.number().min(10)
        })
    })

    try {
        await schema.parse({ foo: "foo", bar: { baz: 9 } })
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Expected value greater than or equal to 10 but received 9")
    }
})

test("should be able to pick fields from an object", async () => {
    const original = schematic.object({
        foo: schematic.string(),
        bar: schematic.number()
    })

    const picked = original.pick("foo")

    const result = await picked.parse({ foo: "foo" })

    expect(result).toEqual({ foo: "foo" })

    try {
        await picked.parse({ foo: "foo", bar: 10 })
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe("Unexpected key 'bar'")
    }
})
