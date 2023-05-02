import { REST, Routes } from "discord.js";
import { CONFIG, LoggingTypes, tryAndExitOnFailureAsync } from "./util.js";
import { readdir } from "fs/promises";
import { AugmentedClient, ExportCommand } from "./setup.js";

export default async function deployCommands(client: AugmentedClient<true>) {
    const files: [string, import("fs").Dirent][] = [];

    async function getCommandsInFolder(path: string) {
        for (const entry of await readdir(path, { withFileTypes: true })) {
            if (entry.isFile() && entry.name.endsWith(".js")) {
                files.push([`${path}/${entry.name}`, entry]);
            } else if (entry.isDirectory()) {
                getCommandsInFolder(`${path}/${entry.name}`);
            }
        }
    }

    await tryAndExitOnFailureAsync(
        () => getCommandsInFolder("./src/commands"),
        `Couldn't find commands to load:`
    );

    for (const file of files) {
        const obj = (await import(`../../${file[0]}`)).default;

        if (obj instanceof ExportCommand) {
            client.commands.set(obj.command.name, obj);
        } else {
            LoggingTypes.Warning(`File '${file[0]}' didn't return a command`);
        }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    await tryAndExitOnFailureAsync(
        async () => {
            const target = CONFIG.devMode ? CONFIG.guildId_DEV : CONFIG.guildId_PROD,
                guild = await client.guilds.fetch(target);

            LoggingTypes.Info(`Refreshing ${client.commands.size} commands for guild '${guild.name}' (id: ${guild.id})`);

            const data = await rest.put(
                Routes.applicationGuildCommands(CONFIG.clientId, target),
                { body: client.commands.mapValues(v => v.command.toJSON()) },
            );

            LoggingTypes.Success(`Refreshed ${(data as any).length ?? client.commands.size} commands for guild '${guild.name}' (id: ${guild.id})`);
        },
        `Failed to deploy commands: `
    );
}