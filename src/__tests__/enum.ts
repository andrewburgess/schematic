import * as schematic from "../"

enum TestEnum {
    foo = "foo",
    bar = "bar"
}

const ArrayEnum = [1, 2, 3] as const
const ObjectEnum = {
    foo: "foo",
    bar: "bar"
} as const

const arrayEnum = schematic.enum(ArrayEnum)
const nativeEnum = schematic.enum(TestEnum)
const objectEnum = schematic.enum(ObjectEnum)

test("should parse a native enum", async () => {
    const result = await nativeEnum.parse("foo")

    expect(result).toBe("foo")
})

test("should parse an array enum", async () => {
    const result = await arrayEnum.parse(1)

    expect(result).toBe(1)
})

test("should parse an object enum", async () => {
    const result = await objectEnum.parse("foo")

    expect(result).toBe("foo")
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

    try {
        await objectEnum.parse("baz")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(schematic.SchematicParseError)
        if (!(error instanceof schematic.SchematicParseError)) {
            return
        }
        expect(error.message).toBe('Unexpected value baz for enum "foo | bar"')
    }
})

test("should allow a default value", async () => {
    const nativeResult = await nativeEnum.default(TestEnum.foo).parse(undefined)

    expect(nativeResult).toBe(TestEnum.foo)

    const arrayResult = await arrayEnum.default(1).parse(undefined)

    expect(arrayResult).toBe(1)

    const objectResult = await objectEnum.default("foo").parse(undefined)

    expect(objectResult).toBe("foo")
})
