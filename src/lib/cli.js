import { createInterface } from "readline";
import { LoggingTypes } from "./util.js";
const readline = createInterface(process.stdin, process.stdout), commands = new Map([
    ["clear", console.clear],
    ["exit", process.exit.bind(process, 0)]
]);
function parse(input) {
    let mode = "command";
    const commands = [];
    let currentCommand = {
        command: "",
        args: []
    }, dashes = 0, argument_name_stringMode = false;
    commands.push(currentCommand);
    for (const char of input) {
        switch (mode) {
            case "command": {
                switch (char) {
                    case " ": break;
                    case "-": {
                        if (++dashes == 2) {
                            dashes = 0;
                            mode = "argument_name";
                        }
                        break;
                    }
                    case ";": {
                        currentCommand = {
                            command: "",
                            args: []
                        };
                        commands.push(currentCommand);
                        break;
                    }
                    default: {
                        currentCommand.command += char;
                    }
                }
                break;
            }
            case "argument_name": {
                switch (char) {
                    case "=":
                    case " ": {
                        if (currentCommand.args.at(-1)?.[0].length) {
                            mode = "argument_value";
                            break;
                        }
                        else
                            throw new Error("Parsing error: found empty flag");
                    }
                    default:
                        (currentCommand.args.at(-1) ?? (() => currentCommand.args[0] = ["", ""])())[0] += char;
                }
                break;
            }
            case "argument_value": {
                switch (char) {
                    case "\"": {
                        if (argument_name_stringMode) {
                            mode = "unknown";
                            currentCommand.args.push(["", ""]);
                            argument_name_stringMode = false;
                        }
                        else {
                            argument_name_stringMode = true;
                        }
                        break;
                    }
                    case " ": {
                        if (!argument_name_stringMode) {
                            mode = "unknown";
                            currentCommand.args.push(["", ""]);
                            break;
                        }
                        // fall-through
                    }
                    case ";": {
                        if (!argument_name_stringMode) {
                            currentCommand = {
                                command: "",
                                args: []
                            };
                            commands.push(currentCommand);
                            mode = "command";
                            break;
                        }
                        // fall-through
                    }
                    case "-": {
                        if (!argument_name_stringMode && ++dashes == 2) {
                            dashes = 0;
                            mode = "argument_name";
                            currentCommand.args.at(-1)[1] = "";
                            currentCommand.args.push(["", ""]);
                            break;
                        }
                        // fall-through
                    }
                    default: {
                        currentCommand.args.at(-1)[1] += char;
                    }
                }
                break;
            }
            case "unknown": {
                switch (char) {
                    case ";": {
                        currentCommand = {
                            command: "",
                            args: []
                        };
                        commands.push(currentCommand);
                        mode = "command";
                        break;
                    }
                    case "-": {
                        if (++dashes == 2) {
                            dashes = 0;
                            mode = "argument_name";
                        }
                        break;
                    }
                    case " ": break;
                    default: {
                        throw new Error(`Unexpected character '${char}'`);
                    }
                }
            }
        }
    }
    return commands;
}
export function startCLI() {
    readline.on("line", ln => {
        if (ln.trim().length == 0)
            return;
        try {
            const queries = parse(ln);
            for (const query of queries) {
                const command = commands.get(query.command);
                if (command)
                    command(new Map(query.args));
                else
                    LoggingTypes.Failure(`Command '${query.command}' not recognized`);
            }
        }
        catch (e) {
            LoggingTypes.Failure(e);
        }
    });
    LoggingTypes.Info.onlyIfVerbose("Started CLI");
}
