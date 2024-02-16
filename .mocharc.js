module.exports = {
    exit: true,
    require: ["ts-node/register"],
    extension: ["ts", "json"],
    recursive: true,
    spec: ["./**/*.test.ts"]
}
