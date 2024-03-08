import * as schematic from "../"
import { assertEqualType } from "../util"

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

test("type inference", () => {
    assertEqualType<schematic.Infer<typeof nativeEnum>, TestEnum>(true)
    assertEqualType<schematic.Infer<typeof arrayEnum>, 1 | 2 | 3>(true)
    assertEqualType<schematic.Infer<typeof objectEnum>, "foo" | "bar">(true)
    assertEqualType<schematic.Infer<typeof stringEnum>, "foo" | "bar">(true)
})

test("enum parsing", async () => {
    await Promise.all([
        expect(nativeEnum.parse("foo")).resolves.toEqual(TestEnum.foo),
        expect(nativeEnum.parse("bar")).resolves.toEqual(TestEnum.bar),
        expect(arrayEnum.parse(1)).resolves.toEqual(1),
        expect(objectEnum.parse("foo")).resolves.toEqual("foo"),
        expect(stringEnum.parse("foo")).resolves.toEqual("foo"),

        expect(nativeEnum.parse(null)).rejects.toThrow(),
        expect(nativeEnum.parse(undefined)).rejects.toThrow(),
        expect(nativeEnum.parse({})).rejects.toThrow(),
        expect(nativeEnum.parse(1)).rejects.toThrow(),
        expect(nativeEnum.parse("hello")).rejects.toThrow(),
        expect(arrayEnum.parse(4)).rejects.toThrow(),
        expect(objectEnum.parse("baz")).rejects.toThrow(),
        expect(stringEnum.parse("baz")).rejects.toThrow()
    ])
})

test("default enum", async () => {
    await Promise.all([
        expect(nativeEnum.default(TestEnum.foo).parse(undefined)).resolves.toEqual(TestEnum.foo),
        expect(arrayEnum.default(1).parse(undefined)).resolves.toEqual(1),
        expect(objectEnum.default("foo").parse(undefined)).resolves.toEqual("foo"),
        expect(stringEnum.default("foo").parse(undefined)).resolves.toEqual("foo")
    ])
})
