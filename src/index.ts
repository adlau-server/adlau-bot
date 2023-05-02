console.clear();
const client = await (await import("./lib/setup.js")).default();
(await import("./lib/cli.js")).startCLI();

export { };