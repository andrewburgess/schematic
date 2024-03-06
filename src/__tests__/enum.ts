import assert from "assert"
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
const StringEnum = ["foo", "bar"] as const

const arrayEnum = schematic.enum(ArrayEnum)
const nativeEnum = schematic.enum(TestEnum)
const objectEnum = schematic.enum(ObjectEnum)
const stringEnum = schematic.enum(StringEnum)

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

test("should parse a string enum", async () => {
    const result = await stringEnum.parse("foo")

    expect(result).toBe("foo")
})

test("should throw an error if the value is not in the enum", async () => {
    const nativeResult = await nativeEnum.safeParse("baz")
    assert(!nativeResult.isValid)
    expect(nativeResult.errors[0].message).toBe('Unexpected value baz for enum "foo | bar"')

    const arrayResult = await arrayEnum.safeParse(4)
    assert(!arrayResult.isValid)
    expect(arrayResult.errors[0].message).toBe('Unexpected value 4 for enum "1 | 2 | 3"')

    const objectResult = await objectEnum.safeParse("baz")
    assert(!objectResult.isValid)
    expect(objectResult.errors[0].message).toBe('Unexpected value baz for enum "foo | bar"')

    const undefinedResult = await stringEnum.safeParse(undefined)
    assert(!undefinedResult.isValid)
    expect(undefinedResult.errors[0].message).toBe("Required")
})

test("should allow a default value", async () => {
    const nativeResult = await nativeEnum.default(TestEnum.foo).parse(undefined)
    expect(nativeResult).toBe(TestEnum.foo)

    const arrayResult = await arrayEnum.default(1).parse(undefined)
    expect(arrayResult).toBe(1)

    const objectResult = await objectEnum.default("foo").parse(undefined)
    expect(objectResult).toBe("foo")
})
