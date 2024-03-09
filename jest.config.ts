module.exports = {
    coverageReporters: ["json-summary", "text", "lcov"],

    transform: {
        "^.+\\.ts$": "ts-jest"
    },

    watchPathIgnorePatterns: ["<rootDir>/lib/", "<rootDir>/node_modules/", "<rootDir>/tools/"]
}
