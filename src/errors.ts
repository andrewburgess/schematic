export class ValidationError extends Error {
    public name: string = "SchematicValidationError"
    public path?: (string | number)[]

    constructor(message: string, path?: (string | number)[]) {
        super(message)
        this.path = path
    }
}
