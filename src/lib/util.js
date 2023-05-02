export const Chalk = new (await import("chalk")).Chalk();
(await import("dotenv")).config();
export function extractValue(value, ...args) {
    return typeof value == "function" ? value(...args) : value;
}
export class SemVer {
    #major;
    get major() { return this.#major; }
    #minor;
    get minor() { return this.#minor; }
    #patch;
    get patch() { return this.#patch; }
    constructor(major, minor, patch) {
        if (major < 0)
            throw new RangeError("A major version number must be greater than 0");
        if (minor < 0)
            throw new RangeError("A minor version number must be greater than 0");
        if (patch < 0)
            throw new RangeError("A patch version number must be greater than 0");
        this.#major = major;
        this.#minor = minor;
        this.#patch = patch;
    }
    toString() {
        return `${this.#major}.${this.#minor}.${this.#patch}`;
    }
    equals(other) {
        return this.#major == other.#major &&
            this.#minor == other.#minor &&
            this.#patch == other.#patch;
    }
    compareTo(other) {
        if (other.#major != this.#major)
            return {
                difference: Math.sign(this.#major - other.#major),
                differenceLevel: "major",
                major: Math.sign(this.#major - other.#major)
            };
        if (other.#minor != this.#minor)
            return {
                difference: Math.sign(this.#minor - other.#minor),
                differenceLevel: "minor",
                minor: Math.sign(this.#minor - other.#minor)
            };
        if (other.#patch != this.#patch)
            return {
                difference: Math.sign(this.#patch - other.#patch),
                differenceLevel: "patch",
                patch: Math.sign(this.#patch - other.#patch)
            };
        return {
            difference: 0,
            differenceLevel: "none"
        };
    }
}
function augment(loggingFn) {
    loggingFn.onlyIfVerbose = (...content) => {
        CONFIG.verboseLogging && loggingFn(content.map(extractValue));
    };
    return loggingFn;
}
export const LoggingTypes = Object.freeze({
    Success: augment((...content) => console.log(Chalk.greenBright(content))),
    Failure: augment((...content) => console.error(Chalk.redBright(content))),
    FatalError: augment((...content) => console.error(Chalk.bgRedBright(content))),
    Info: augment((...content) => console.info(Chalk.blueBright(content))),
    Warning: augment((...content) => console.warn(Chalk.yellowBright(content))),
});
export function tryAndExitOnFailure(cb, errorMessage) {
    try {
        return cb();
    }
    catch (e) {
        LoggingTypes.FatalError(errorMessage);
        console.error(e);
        process.exitCode = 1;
        throw "";
    }
}
export async function tryAndExitOnFailureAsync(cb, errorMessage) {
    try {
        return await cb();
    }
    catch (e) {
        LoggingTypes.FatalError(errorMessage);
        console.error(e);
        process.exitCode = 1;
        throw "";
    }
}
export const BOT_VERSION = new SemVer(0, 2, 0);
export const CONFIG = JSON.parse((await (async () => {
    const fileHandle = await tryAndExitOnFailureAsync(async () => (await import("fs/promises")).open("src/config.json"), `Couldn't find the configuration file`), content = fileHandle.readFile();
    fileHandle.close();
    return content;
})()).toString());
