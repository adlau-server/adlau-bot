export const Chalk = new (await import("chalk")).Chalk();
(await import("dotenv")).config();

type NumericSign = -1 | 0 | 1;

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly DISCORD_TOKEN: string;
        }
    }

    interface Math {
        sign(x: number): NumericSign;
    }
}

export type FunctionWrapper<T, U extends any[] = []> = (...args: U) => T;

export type MayBeFunctionWrapped<T, U extends any[] = []> = T | FunctionWrapper<T, U>;

export function extractValue<T, U extends any[] = []>(value: MayBeFunctionWrapped<T, U>, ...args: U) {
    return typeof value == "function" ? (value as FunctionWrapper<T, U>)(...args) : value;
}

export class SemVer {
    #major: number;
    get major() { return this.#major; }

    #minor: number;
    get minor() { return this.#minor; }

    #patch: number;
    get patch() { return this.#patch; }

    constructor(major: number, minor: number, patch: number) {
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

    toString(): `${number}.${number}.${number}` {
        return `${this.#major}.${this.#minor}.${this.#patch}`;
    }

    equals(other: SemVer) {
        return this.#major == other.#major &&
            this.#minor == other.#minor &&
            this.#patch == other.#patch;
    }

    compareTo(other: SemVer): {
        difference: NumericSign;
    } & (
            { differenceLevel: "major", major: NumericSign; } |
            { differenceLevel: "minor", minor: NumericSign; } |
            { differenceLevel: "patch", patch: NumericSign; } |
            { differenceLevel: "none", }
        ) {
        if (other.#major != this.#major)
            return {
                difference: Math.sign(this.#major - other.#major),
                differenceLevel: "major" as const,
                major: Math.sign(this.#major - other.#major)
            };

        if (other.#minor != this.#minor)
            return {
                difference: Math.sign(this.#minor - other.#minor),
                differenceLevel: "minor" as const,
                minor: Math.sign(this.#minor - other.#minor)
            };

        if (other.#patch != this.#patch)
            return {
                difference: Math.sign(this.#patch - other.#patch),
                differenceLevel: "patch" as const,
                patch: Math.sign(this.#patch - other.#patch)
            };

        return {
            difference: 0,
            differenceLevel: "none" as const
        };
    }
}

type LoggingFunction = (...content: any[]) => void;
type AugmentedLoggingFunction = ((...content: any[]) => void) & {
    onlyIfVerbose: LoggingFunction;
};

function augment(loggingFn: LoggingFunction) {
    (loggingFn as AugmentedLoggingFunction).onlyIfVerbose = (...content: MayBeFunctionWrapped<any>[]) => {
        CONFIG.verboseLogging && loggingFn(content.map(extractValue));
    };
    return loggingFn as AugmentedLoggingFunction;
}

export const LoggingTypes = Object.freeze({
    Success: augment((...content: any[]) => console.log(Chalk.greenBright(content))),
    Failure: augment((...content: any[]) => console.error(Chalk.redBright(content))),
    FatalError: augment((...content: any[]) => console.error(Chalk.bgRedBright(content))),
    Info: augment((...content: any[]) => console.info(Chalk.blueBright(content))),
    Warning: augment((...content: any[]) => console.warn(Chalk.yellowBright(content))),
});

export function tryAndExitOnFailure<T>(cb: () => T, errorMessage: string) {
    try {
        return cb();
    } catch (e) {
        LoggingTypes.FatalError(errorMessage);
        console.error(e);
        process.exitCode = 1;
        throw "";
    }
}

export async function tryAndExitOnFailureAsync<T>(cb: () => Promise<T>, errorMessage: string) {
    try {
        return await cb();
    } catch (e) {
        LoggingTypes.FatalError(errorMessage);
        console.error(e);
        process.exitCode = 1;
        throw "";
    }
}

export const BOT_VERSION = new SemVer(0, 2, 0);
export const CONFIG: Readonly<{
    readonly verboseLogging: boolean,
    readonly clientId: import("discord.js").Snowflake,
    readonly guildId_DEV: import("discord.js").Snowflake,
    readonly guildId_PROD: import("discord.js").Snowflake,
    readonly devMode: boolean;
}> =
    JSON.parse(
        (
            await (async () => {
                const fileHandle = await tryAndExitOnFailureAsync(
                    async () => (await import("fs/promises")).open("src/config.json"),
                    `Couldn't find the configuration file`
                ),
                    content = fileHandle.readFile();

                fileHandle.close();
                return content;
            })()
        ).toString()
    );