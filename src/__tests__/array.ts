import * as schematic from "../"
import { assertEqualType } from "../util"

test("types should be correct", async () => {
    const stringArray = schematic.array(schematic.string())
    const objectArray = schematic.array(schematic.object({ name: schematic.string() }))
    const objectWithOptionalArray = schematic.object({
        name: schematic.string(),
        array: schematic.array(schematic.string()),
        array2: schematic.array(schematic.string()).optional()
    })

    assertEqualType<schematic.Infer<typeof stringArray>, string[]>(true)
    assertEqualType<schematic.Infer<typeof objectArray>, { name: string }[]>(true)
    assertEqualType<
        schematic.Infer<typeof objectWithOptionalArray>,
        { name: string; array?: string[] }
    >(true)
})

test("should parse array", async () => {
    const array = schematic.array(schematic.string())
    const result = await array.parse(["hello", "world"])
    expect(result).toEqual(["hello", "world"])
})

test("should allow specifying minimum number of elements", async () => {
    const array = schematic.array(schematic.string()).min(2)
    await expect(array.parse(["hello"])).rejects.toThrow(
        "Expected at least 2 elements but received 1"
    )
    await expect(array.parse(["hello", "world"])).resolves.toEqual(["hello", "world"])

    const exclusiveArray = schematic.array(schematic.string()).min(2, { exclusive: true })
    await expect(exclusiveArray.parse(["hello", "world"])).rejects.toThrow(
        "Expected more than 2 elements but received 2"
    )
})

test("should allow specifying exact number of elements", async () => {
    const array = schematic.array(schematic.string()).length(2)
    await expect(array.parse(["hello"])).rejects.toThrow(
        "Expected array with exactly 2 elements but received 1"
    )
    await expect(array.parse(["hello", "world"])).resolves.toEqual(["hello", "world"])
})

test("should allow specifying maximum number of elements", async () => {
    const array = schematic.array(schematic.string()).max(2)
    await expect(array.parse(["hello", "world", "foo"])).rejects.toThrow(
        "Expected array with at most 2 elements but received 3"
    )
    await expect(array.parse(["hello", "world"])).resolves.toEqual(["hello", "world"])

    const exclusiveArray = schematic.array(schematic.string()).max(2, { exclusive: true })
    await expect(exclusiveArray.parse(["hello", "world"])).rejects.toThrow(
        "Expected array with less than 2 elements but received 2"
    )
})

test("should allow specifying at least one element", async () => {
    const array = schematic.array(schematic.string()).nonempty()
    await expect(array.parse([])).rejects.toThrow("Expected at least 1 element but received 0")
    await expect(array.parse(["hello"])).resolves.toEqual(["hello"])
})

test("should allow combining min and max", async () => {
    const array = schematic.array(schematic.string()).min(2).max(4)
    await expect(array.parse(["hello"])).rejects.toThrow(
        "Expected at least 2 elements but received 1"
    )
    await expect(array.parse(["hello", "world", "foo", "bar", "baz"])).rejects.toThrow(
        "Expected array with at most 4 elements but received 5"
    )
    await expect(array.parse(["hello", "world", "foo"])).resolves.toEqual(["hello", "world", "foo"])
})

test("should validate all of the elements instead of stopping at the first error", async () => {
    const array = schematic.array(schematic.string())
    try {
        await array.parse(["hello", 1, "world", 2, "foo", 3])
        expect(true).toBe(false)
    } catch (e) {
        expect(e).toBeInstanceOf(schematic.SchematicParseError)
        const error = e as schematic.SchematicParseError

        expect(error.errors).toHaveLength(3)
        expect(error.errors[0].message).toBe("Expected string but received number")
        expect(error.errors[1].message).toBe("Expected string but received number")
        expect(error.errors[2].message).toBe("Expected string but received number")
        expect(error.errors[0].path).toEqual([1])
        expect(error.errors[1].path).toEqual([3])
        expect(error.errors[2].path).toEqual([5])
    }
})

test("should fail if array is sparse", async () => {
    const array = schematic.array(schematic.string()).min(1).max(3)
    try {
        const value = new Array(3)
        value[1] = "hello"
        await array.parse(value)
        expect(true).toBe(false)
    } catch (e) {
        expect(e).toBeInstanceOf(schematic.SchematicParseError)
        const error = e as schematic.SchematicParseError

        expect(error.errors).toHaveLength(2)
    }
})
