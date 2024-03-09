import { assertEqualType } from "../util"
import * as schematic from "../"

const schema = schematic.date()

test("type inference", () => {
    assertEqualType<schematic.Infer<typeof schema>, Date>(true)
})

test("date parsing", async () => {
    await expect(schema.parse(new Date("2021-01-01"))).resolves.toEqual(new Date("2021-01-01"))
    await expect(schema.parse(null)).rejects.toThrow()
    await expect(schema.parse(undefined)).rejects.toThrow()
    await expect(schema.parse({})).rejects.toThrow()
    await expect(schema.parse(1)).rejects.toThrow()
    await expect(schema.parse("hello")).rejects.toThrow()
})

test("minimum date", async () => {
    await expect(schema.min(new Date("2021-01-01")).parse(new Date("2021-01-01"))).resolves.toEqual(
        new Date("2021-01-01")
    )
    await expect(
        schema.min(new Date("2021-01-01").getTime()).parse(new Date("2021-01-01"))
    ).resolves.toEqual(new Date("2021-01-01"))
    await expect(schema.min(new Date("2021-01-01")).parse(new Date("2020-12-31"))).rejects.toThrow()
    await expect(
        schema.min(new Date("2021-01-01"), { exclusive: true }).parse(new Date("2021-01-01"))
    ).rejects.toThrow()
})

test("maximum date", async () => {
    await expect(schema.max(new Date("2021-01-01")).parse(new Date("2021-01-01"))).resolves.toEqual(
        new Date("2021-01-01")
    )
    await expect(
        schema.max(new Date("2021-01-01").getTime()).parse(new Date("2021-01-01"))
    ).resolves.toEqual(new Date("2021-01-01"))
    await expect(schema.max(new Date("2021-01-01")).parse(new Date("2021-01-02"))).rejects.toThrow()
    await expect(
        schema.max(new Date("2021-01-01"), { exclusive: true }).parse(new Date("2021-01-01"))
    ).rejects.toThrow()
})

test("default date", async () => {
    await expect(schema.default(new Date("2021-01-01")).parse(undefined)).resolves.toEqual(
        new Date("2021-01-01")
    )
    await expect(schema.default(() => new Date("2021-01-01")).parse(undefined)).resolves.toEqual(
        new Date("2021-01-01")
    )
})

test("coerce date", async () => {
    const coerce = schema.coerce()
    await expect(coerce.parse("2021-01-01")).resolves.toEqual(new Date("2021-01-01"))
    await expect(coerce.parse(1612137600000)).resolves.toEqual(new Date("2021-02-01"))
    await expect(coerce.parse(new Date("2021-01-01"))).resolves.toEqual(new Date("2021-01-01"))
})
