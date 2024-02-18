export function clone<T>(value: T): T {
    if (typeof value !== "object" || value === null) {
        return value
    }
    if (Array.isArray(value)) {
        return value.map((elem) => clone(elem)) as any
    }
    const cpy: any = Object.create(null)
    for (const k in value) {
        cpy[k] = clone(value[k])
    }
    for (const s of Object.getOwnPropertySymbols(value)) {
        cpy[s] = clone((value as any)[s])
    }
    Object.setPrototypeOf(cpy, Object.getPrototypeOf(value))
    return cpy
}
