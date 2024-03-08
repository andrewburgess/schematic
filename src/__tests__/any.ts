import * as schematic from "../"
import { assertEqualType } from "../util"

const anySchema = schematic.any()

test("type inference should be any", () => {
    const anyOptional = anySchema.optional()
    const anyNullable = anySchema.nullable()
    const anyOptionalNullable = anySchema.optional().nullable()

    assertEqualType<schematic.Infer<typeof anySchema>, any>(true)
    assertEqualType<schematic.AnyValueSchematic, typeof anySchema>(true)
    assertEqualType<schematic.Infer<typeof anyOptional>, any>(true)
    assertEqualType<schematic.AnyValueSchematic, typeof anyOptional>(true)
    assertEqualType<schematic.Infer<typeof anyNullable>, any>(true)
    assertEqualType<schematic.AnyValueSchematic, typeof anyNullable>(true)
    assertEqualType<schematic.Infer<typeof anyOptionalNullable>, any>(true)
    assertEqualType<schematic.AnyValueSchematic, typeof anyOptionalNullable>(true)
})

test("should parse any value", async () => {
    await Promise.all([
        anySchema.parse(undefined).then((value) => expect(value).toBe(undefined)),
        anySchema.parse(null).then((value) => expect(value).toBe(null)),
        anySchema.parse(0).then((value) => expect(value).toBe(0)),
        anySchema.parse(1).then((value) => expect(value).toBe(1)),
        anySchema.parse("").then((value) => expect(value).toBe("")),
        anySchema.parse("hello").then((value) => expect(value).toBe("hello")),
        anySchema.parse([1]).then((value) => expect(value).toEqual([1])),
        anySchema.parse({ foo: "bar" }).then((value) => expect(value).toEqual({ foo: "bar" }))
    ])
})
