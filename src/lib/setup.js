import { Client, Collection, version, APIVersion, GatewayIntentBits, Events } from "discord.js";
import { LoggingTypes, tryAndExitOnFailure, Chalk, BOT_VERSION } from "./util.js";
import deployCommands from "./deploy.js";
export class ExportCommand {
    #command;
    get command() { return this.#command; }
    #executor;
    get executor() { return this.#executor; }
    constructor(command, executor) {
        this.#command = command;
        this.#executor = executor;
    }
}
;
console.clear();
LoggingTypes.Info.onlyIfVerbose("Imported deps");
LoggingTypes.Info.onlyIfVerbose(`Using discord.js v${version} (internally connected to Discord API v${APIVersion})`);
function createClient() {
    return tryAndExitOnFailure(() => {
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ]
        });
        // @ts-expect-error
        client.commands = new Collection();
        return client;
    }, `There was an error while instantiating the client:`);
}
async function login(client) {
    return await tryAndExitOnFailure(async () => {
        LoggingTypes.Info(`Attempting to login…`);
        await client.login(process.env.DISCORD_TOKEN);
        LoggingTypes.Success(`Successfully logged in as ${Chalk.underline(`${client.user.username}#${client.user.discriminator}`)}`);
        LoggingTypes.Info(`adlau bot v${BOT_VERSION} is now running`);
        return client;
    }, `There was an error while logging in:`);
}
export default async function start() {
    const client = await login(createClient());
    await deployCommands(client);
    client.on(Events.InteractionCreate, interaction => {
        if (!interaction.isChatInputCommand())
            return;
        const command = client.commands.get(interaction.commandName);
        if (command) {
            command.executor(interaction);
        }
        else {
            LoggingTypes.Failure(`Unknown command '${interaction.commandName}'`);
        }
    });
    return client;
}
