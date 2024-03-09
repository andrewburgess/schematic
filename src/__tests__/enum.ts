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

    assertEqualType<typeof ArrayEnum, typeof arrayEnum.shape>(true)
})

test("enum parsing", async () => {
    await expect(nativeEnum.parse("foo")).resolves.toEqual(TestEnum.foo)
    await expect(nativeEnum.parse("bar")).resolves.toEqual(TestEnum.bar)
    await expect(arrayEnum.parse(1)).resolves.toEqual(1)
    await expect(objectEnum.parse("foo")).resolves.toEqual("foo")
    await expect(stringEnum.parse("foo")).resolves.toEqual("foo")

    await expect(nativeEnum.parse(null)).rejects.toThrow()
    await expect(nativeEnum.parse(undefined)).rejects.toThrow()
    await expect(nativeEnum.parse({})).rejects.toThrow()
    await expect(nativeEnum.parse(1)).rejects.toThrow()
    await expect(nativeEnum.parse("hello")).rejects.toThrow()
    await expect(arrayEnum.parse(4)).rejects.toThrow()
    await expect(objectEnum.parse("baz")).rejects.toThrow()
    await expect(stringEnum.parse("baz")).rejects.toThrow()
})

test("default enum", async () => {
    await expect(nativeEnum.default(TestEnum.foo).parse(undefined)).resolves.toEqual(TestEnum.foo)
    await expect(arrayEnum.default(1).parse(undefined)).resolves.toEqual(1)
    await expect(objectEnum.default("foo").parse(undefined)).resolves.toEqual("foo")
    await expect(stringEnum.default("foo").parse(undefined)).resolves.toEqual("foo")

    await expect(nativeEnum.default(() => TestEnum.foo).parse(undefined)).resolves.toEqual(
        TestEnum.foo
    )
    await expect(arrayEnum.default(() => ArrayEnum[0]).parse(undefined)).resolves.toEqual(1)
    await expect(objectEnum.default(() => ObjectEnum.foo).parse(undefined)).resolves.toEqual("foo")
    await expect(stringEnum.default(() => StringEnum[0]).parse(undefined)).resolves.toEqual("foo")
})
