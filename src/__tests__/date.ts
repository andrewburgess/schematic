import * as schematic from "../"

describe("date", () => {
    const schema = schematic.date()

    test("should parse a date", async () => {
        const result = await schema.parse(new Date("2021-01-01"))
        expect(result).toEqual(new Date("2021-01-01"))
    })

    test("should throw an error if the date is invalid", async () => {
        try {
            await schema.parse("invalid")
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe("Expected Date but received string")
        }
    })

    test("should allow setting a minimum date", async () => {
        const result = await schema.min(new Date("2021-01-01")).parse(new Date("2021-01-01"))
        expect(result).toEqual(new Date("2021-01-01"))
    })

    test("should throw an error if the date is less than the minimum", async () => {
        try {
            await schema.min(new Date("2021-01-01")).parse(new Date("2020-12-31"))
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe(
                "Expected Date greater than or equal to 2021-01-01T00:00:00.000Z but received 2020-12-31T00:00:00.000Z"
            )
        }
    })

    test("should throw an error if the date is less than the exclusive minimum", async () => {
        try {
            await schema
                .min(new Date("2021-01-01"), { exclusive: true })
                .parse(new Date("2021-01-01"))
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe(
                "Expected Date greater than 2021-01-01T00:00:00.000Z but received 2021-01-01T00:00:00.000Z"
            )
        }
    })

    test("should allow setting a maximum date", async () => {
        const result = await schema.max(new Date("2021-01-01")).parse(new Date("2021-01-01"))
        expect(result).toEqual(new Date("2021-01-01"))
    })

    test("should throw an error if the date is greater than the maximum", async () => {
        try {
            await schema.max(new Date("2021-01-01")).parse(new Date("2021-01-02"))
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe(
                "Expected Date less than or equal to 2021-01-01T00:00:00.000Z but received 2021-01-02T00:00:00.000Z"
            )
        }
    })

    test("should throw an error if the date is greater than the exclusive maximum", async () => {
        try {
            await schema
                .max(new Date("2021-01-01"), { exclusive: true })
                .parse(new Date("2021-01-01"))
        } catch (error) {
            expect(error).toBeInstanceOf(schematic.SchematicParseError)
            if (!(error instanceof schematic.SchematicParseError)) {
                return
            }
            expect(error.message).toBe(
                "Expected Date less than 2021-01-01T00:00:00.000Z but received 2021-01-01T00:00:00.000Z"
            )
        }
    })

    test("should allow setting a default value", async () => {
        const result = await schema.default(new Date("2021-01-01")).parse(undefined)
        expect(result).toEqual(new Date("2021-01-01"))
    })

    test("should allow setting a default value as a function", async () => {
        const result = await schema.default(() => new Date("2021-01-01")).parse(undefined)
        expect(result).toEqual(new Date("2021-01-01"))
    })

    test("should allow coercing a string to a date", async () => {
        const result = await schema.coerce().parse("2021-01-01")
        expect(result).toEqual(new Date("2021-01-01"))
    })

    test("should allow coercing a number to a date", async () => {
        const result = await schema.coerce().parse(1612137600000)
        expect(result).toEqual(new Date("2021-02-01"))
    })

    test("should allow coercing a date to a date", async () => {
        const result = await schema.coerce().parse(new Date("2021-01-01"))
        expect(result).toEqual(new Date("2021-01-01"))
    })
})
