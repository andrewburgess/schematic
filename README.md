# Schematic

`schematic` is a TypeScript first validator and transformer. It is very similar in scope to
[`zod`](https://github.com/colinhacks/zod), but with simplified definitions that should speed up the
developer experience when working with complex schemas.

## Installation

```sh
npm install --save @andrewburgess/schematic
```

You should also make sure `strict: true` is set in your `tsconfig.json` configuration

## Usage

```typescript
import * as s from "@andrewburgess/schematic"

const schema = s.object({
    foo: s.string().min(5),
    bar: s.number().optional()
})

type Schema = s.Infer<typeof schema>

const data = await schema.parse({ foo: "hello" })

/**
 * typeof Schema:
 * {
 *   foo: string;
 *   bar?: number | undefined
 * }
 */

data.foo = "hello"
```

## API

> **NOTE**: `schematic` parsing is done asynchronously _always_. There is not a synchronous version.
> This could change in the future, but at the moment, be aware that the output of `parse` will need
> to be `await`ed.

### Parsing

`schematic` schemas provide two primary ways of parsing an input value

-   `parse` will return the parsed/transformed value if it succeeds, or it will throw a
    `SchematicParseError` with the `errors` that were discovered.
-   `safeParse` will not throw on parsing errors, and will instead return an object that indicates
    parsing success.

    ```typescript
    const a = s.string()
    const valid = await a.safeParse("hello")
    const invalid = await a.safeParse(1)

    if (valid.isValid) {
        console.log(valid.value)
    }

    if (!invalid.isValid) {
        console.log(invalid.errors)
    }
    ```

### Type Checking

#### Basic Types

```typescript
import * as s from "@andrewburgess/schematic"

s.any() // Any type is allowed, including undefined
s.boolean()
s.date()
s.number()
s.string()
s.literal(_value) // Value must exactly match the provided value

s.object({
    field: s.string()
})

// Record type allows for specifying the schema of the key
s.record(s.string().min(2), s.number())
// Passing only one argument means the key schema will default to `s.string()`
s.record(s.number())

// Enumerations will validate that the value to parse is present in the enum
// You can use a few different enumeration definitions. Note that for arrays,
// they _MUST_ be defined as `const`
enum MyEnum {
    Foo,
    Bar
}
const ArrayEnum = [1, 2, 3] as const
const ObjectEnum = { Foo: "Foo", Bar: "Bar" }
const StringEnum = ["foo", "bar"] as const
s.enum(MyEnum)
s.enum(ArrayEnum)
s.enum(ObjectEnum)
s.enum(StringEnum)
```

#### Coercion

Certain types allow for coercion to the expected type.

**EXAMPLE**

```typescript
const schema = s.boolean().coerce()

const value = await schema.parse("true")
console.log(value) // true
```

`schematic`s coercion applies some heuristics when doing the conversion.

##### Booleans

-   `"true"` ➡️ `true`
-   `"false"` ➡️ `false`
-   `1` ➡️ `true`
-   `0` ➡️ `false`

No other values will coerce to a boolean and will throw a type error

##### Dates

Dates will attempt to coerce using `new Date(_value)`, so anything that the `Date` constructor can
parse will pass

##### Strings

Strings will coerce using `String(_value)`

#### Defaults

Certain types will allow for a default to be specified when defining a schema. These will be used if
the value to parse is `undefined` _only_

Types with defaults are:

-   `boolean`
-   `date`
-   `enum`
-   `number`
-   `string`

### Objects

Object schemas can specify some options when creating them.

```typescript
const schema = s.object({ foo: s.string() }, { unknownKeys: s.UnknownKeys.Allow })
```

The options allow for:

```typescript
{
    unknownKeys: s.UnknownKeys
}
```

Where `UnknownKeys` is an enum that maps as follows:

-   `UnknownKeys.Allow` - an object will pass extra keys through without parsing them
-   `UnknownKeys.Reject` - if an object has unspecified keys, the parsing will fail
-   `UnknownKeys.Strip` - `default` - any unspecified keys will be removed from the input

#### Manipulating Object Shapes

`schematic` supports manipulating an object schema to produce a new schema

```typescript
const base = s.object({
    foo: s.string(),
    bar: s.number()
})

const partial = base.partial() // Makes all child keys optional
const required = partial.required() // Makes all optional keys required
const fooOptional = base.partial("foo") // Makes the `foo` key optional only
const fooRequired = fooOptional.required("foo") // Can make foo required again

const fooOnly = base.pick("foo") // Picks the 'foo' key to produce a new schema
const fooOmit = base.omit("foo") // Omits the 'foo' key to produce a new schema

// Creates a new schema that extends the `base` schema, adding a new field
const combined = base.extend({
    baz: s.boolean()
})

// Alternatively, merge can merge two object schemas
const baz = s.object({
    baz: s.boolean()
})
const combined2 = base.merge(baz)
```

### And/Or Schemas

You can create a schema that requires a value to pass both validations, or a schema where one of a
set of schemas must pass

#### And (intersection)

```typescript
const name = s.object({ name: s.string() })
const age = s.object({ age: s.number() })

const person = name.and(age)
```

`person` will require both `name` and `age` to be present

#### Or (union)

```typescript
const stringOrNumber = s.string().or(s.number())
const value = await stringOrNumber.parse(1)
// typeof value: string | number
```

### Custom Validations

`schematic` has two methods for adding additional validations:

`.test((input) => boolean)` is for simple checks that can indicate whether the `input` is valid

`.ensure((input, context) => void)` is for more involved checking of a type. Problems with the input
can be raised using `context.addError({ message: 'Input is not correct' })`

### Transformations and Piping

#### Transform

A schema can be run through a transformation function after parsing to produce a new type output.
The transformation can also allow for doing additional validations and raising errors if the
transformation is not correct.

The `transform` function can be `async` as well

```typescript
const a = s.string().transform((input, context) => input.length)
const output = await a.parse("hello")
// typeof output = number
// output === 5
```

#### Pipe

A schema can be piped into another schema and then validated there as well. This is most beneficial
after running a transformation.

```typescript
const a = s.string().transform((input) => input.length)
const b = a.pipe(s.number().min(5))

const output = await b.parse("hello")
const throws = await b.parse("hi") // Does not pass validation
```
