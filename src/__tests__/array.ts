import assert from "assert"
import * as schematic from "../"
import { assertEqualType } from "../util"

const stringArray = schematic.array(schematic.string())
const otherStringArray = schematic.string().array()
const objectArray = schematic.array(schematic.object({ name: schematic.string() }))
const objectWithOptionalArray = schematic.object({
    name: schematic.string(),
    array: schematic.array(schematic.string()).optional()
})

test("type inference", async () => {
    assertEqualType<schematic.Infer<typeof stringArray>, string[]>(true)
    assertEqualType<schematic.Infer<typeof otherStringArray>, string[]>(true)
    assertEqualType<schematic.Infer<typeof objectArray>, { name: string }[]>(true)
    assertEqualType<
        schematic.Infer<typeof objectWithOptionalArray>,
        { name: string; array?: string[] }
    >(true)
})

test("array parsing", async () => {
    await Promise.all([
        expect(stringArray.parse(["hello", "world"])).resolves.toEqual(["hello", "world"]),
        expect(stringArray.parse([])).resolves.toEqual([]),
        expect(objectArray.parse([{ name: "hello" }, { name: "world" }])).resolves.toEqual([
            { name: "hello" },
            { name: "world" }
        ]),

        expect(stringArray.parse(null)).rejects.toThrow(),
        expect(stringArray.parse(undefined)).rejects.toThrow(),
        expect(stringArray.parse({})).rejects.toThrow(),
        expect(stringArray.parse(1)).rejects.toThrow(),
        expect(stringArray.parse("hello")).rejects.toThrow()
    ])
})

test("minimum elements", async () => {
    const array = stringArray.min(2)
    const exclusiveArray = stringArray.min(2, { exclusive: true })

    await Promise.all([
        expect(array.parse(["hello"])).rejects.toThrow(),
        expect(array.parse(["hello", "world"])).resolves.toEqual(["hello", "world"]),

        expect(exclusiveArray.parse(["hello", "world"])).rejects.toThrow()
    ])
})

test("exact number of elements", async () => {
    const array = stringArray.length(2)
    await Promise.all([
        expect(array.parse(["hello"])).rejects.toThrow(),
        expect(array.parse(["hello", "world"])).resolves.toEqual(["hello", "world"])
    ])
})

test("maximum elements", async () => {
    const array = stringArray.max(2)
    const exclusiveArray = stringArray.max(2, { exclusive: true })

    await Promise.all([
        expect(array.parse(["hello", "world", "foo"])).rejects.toThrow(),
        expect(array.parse(["hello", "world"])).resolves.toEqual(["hello", "world"]),

        expect(exclusiveArray.parse(["hello", "world"])).rejects.toThrow()
    ])
})

test("nonempty array", async () => {
    const array = stringArray.nonempty()
    await Promise.all([
        expect(array.parse([])).rejects.toThrow("Expected at least 1 element but received 0"),
        expect(array.parse(["hello"])).resolves.toEqual(["hello"])
    ])
})

test("minimum and maximum", async () => {
    const array = stringArray.min(2).max(4)
    await Promise.all([
        expect(array.parse(["hello"])).rejects.toThrow(),
        expect(array.parse(["hello", "world", "foo", "bar", "baz"])).rejects.toThrow(),
        expect(array.parse(["hello", "world", "foo"])).resolves.toEqual(["hello", "world", "foo"])
    ])
})

test("validate all members", async () => {
    const result = await stringArray.safeParse(["hello", 1, "world", 2, "foo", 3])

    assert(result.isValid === false)
    const errors = result.errors as schematic.SchematicError[]

    expect(errors).toHaveLength(3)
    expect(errors[0].path).toEqual([1])
    expect(errors[1].path).toEqual([3])
    expect(errors[2].path).toEqual([5])
})

test("sparse array validation", async () => {
    const array = stringArray.min(1).max(3)
    const value = new Array(3)
    value[1] = "hello"
    const result = await array.safeParse(value)
    assert(result.isValid === false)
    const errors = result.errors as schematic.SchematicError[]

    expect(errors).toHaveLength(2)
})
