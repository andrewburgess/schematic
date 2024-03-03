import * as schematic from "../"

enum TestEnum {
    foo = "foo",
    bar = "bar"
}

const ArrayEnum = [1, 2, 3] as const

describe("enum", () => {
    const arrayEnum = schematic.enum(ArrayEnum)
    const nativeEnum = schematic.enum(TestEnum)

    test("should parse a native enum", async () => {
        const result = await nativeEnum.parse("foo")

        expect(result).toBe("foo")
    })

    test("should parse an array enum", async () => {
        const result = await arrayEnum.parse(1)

        expect(result).toBe(1)
    })

    test("should throw an error if the value is not in the enum", async () => {
        try {
            await nativeEnum.parse("baz")
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe('Unexpected value baz for enum "foo | bar"')
        }

        try {
            await arrayEnum.parse(4)
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe('Unexpected value 4 for enum "1 | 2 | 3"')
        }
    })
})
