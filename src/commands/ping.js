import { SlashCommandBuilder } from "discord.js";
import { ExportCommand } from "../lib/setup.js";
class Noun {
    generalForm;
    articleForm;
    preference;
    constructor(generalForm, articleForm, preference) {
        this.generalForm = generalForm;
        this.articleForm = articleForm;
        this.preference = preference;
    }
    generateDecoratedForm() {
        const useAdjectives = Math.random() > 0.5;
        let preference = this.preference == "none"
            ? pickRandom(["article", "general"])
            : this.preference;
        switch (preference) {
            case "general": {
                if (useAdjectives) {
                    const adjective = pickRandom(adjectives);
                    switch (adjective.positionPreference) {
                        case "before": return `${adjective.generalForm} ${this.generalForm}`;
                        case "after": return `${this.generalForm} ${adjective.generalForm}`;
                    }
                }
                return this.generalForm;
            }
            case "article": {
                if (useAdjectives) {
                    const adjective = pickRandom(adjectives);
                    switch (adjective.positionPreference) {
                        case "before": return `${adjective.articleForm} ${this.generalForm}`;
                        case "after": return `${this.articleForm} ${adjective.generalForm}`;
                    }
                }
                return this.generalForm;
            }
        }
    }
    getPreferredForm() {
        switch (this.preference) {
            case "general": return this.generalForm;
            case "article": return this.articleForm;
            case "none": return pickRandom([this.generalForm, this.articleForm]);
        }
    }
}
class Adjective {
    generalForm;
    articleForm;
    positionPreference;
    constructor(generalForm, articleForm, positionPreference) {
        this.generalForm = generalForm;
        this.articleForm = articleForm;
        this.positionPreference = positionPreference;
    }
}
class Verb {
    infinitive;
    conjugated;
    canUseWould;
    linksWithVerbs;
    constructor(infinitive, conjugated, canUseWould, linksWithVerbs) {
        this.infinitive = infinitive;
        this.conjugated = conjugated;
        this.canUseWould = canUseWould;
        this.linksWithVerbs = linksWithVerbs;
    }
    randomForm() {
        return pickRandom([this.infinitive, this.conjugated]);
    }
    getLinkage() {
        if (this.linksWithVerbs) {
            return pickRandom(verbs.concat(nouns));
        }
        return pickRandom(nouns);
    }
    createLinkage() {
        const object = this.getLinkage();
        if (object instanceof Verb && this.canUseWould && Math.random() > 0.5) {
            return `would ${this.conjugated} ${object.infinitive} ${pickRandom(nouns).generateDecoratedForm()}`;
        }
        return `${this.conjugated} ${pickRandom(nouns).generateDecoratedForm()}`;
    }
}
const nouns = [
    new Noun("zinccy", "a zinccy", "general"),
    new Noun("eiπ", "an eiπ", "general"),
    new Noun("toppy", "a toppy", "general"),
    new Noun("craft", "a craft", "general"),
    new Noun("anime", "an anime", "general"),
    new Noun("hentai", "a hentai", "none"),
    new Noun("yiff", "a yiff", "general"),
    new Noun("kpop", "some kpop", "general"),
    new Noun("furries", "a furry", "general"),
    new Noun("weebs", "a weeb", "article"),
    new Noun("love", "", "general"),
    new Noun("hate", "", "general"),
    new Noun("worship", "", "general"),
    new Noun("stans", "a stan", "none"),
    new Noun("", "the one who knocks", "article"),
], verbs = [
    new Verb("to love", "love", true, true),
    new Verb("to hate", "hate", true, true),
    new Verb("to be", "am", false, false),
    new Verb("to worship", "worship", false, false),
    new Verb("to stan", "stan", false, false),
    new Verb("to want", "want", true, true),
    new Verb("to need", "need", true, true),
    new Verb("to desire", "desire", false, false),
], adjectives = [
    new Adjective("trans", "a trans", "before"),
    new Adjective("gay", "a gay", "before"),
    new Adjective("furry", "a furry", "before"),
];
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function generateZinccy() {
    return `${pickRandom(["kinky ", ""])}zinccy${pickRandom([" winky", ""])}${pickRandom([" furry", " fuwwy", ""])}`;
}
export default new ExportCommand(new SlashCommandBuilder()
    .setName("zinccy")
    .setDescription("zinccy-related propaganda"), interaction => {
    interaction.reply(`I, ${generateZinccy()}, ${pickRandom(verbs).createLinkage()}`);
});
