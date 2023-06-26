import process from 'process';
import fs from "fs";
import {promisify} from "util";
import {convertFtbQuests} from "odysseus";
import {HeraclesQuest} from "odysseus/HeraclesQuest";

const args = process.argv.splice(2);

if (args.length % 2 !== 0) {
    throw new Error('Invalid argument length');
}

let type: 'ftb' | 'hqm' | null = null;
let inputPath: string | null = null;
let outputPath: string | null = null;

for (let i = 0; i < args.length; i += 2) {
    const argumentType = args[i].toLowerCase();
    const argumentValue = args[i + 1];

    if (argumentType === '--type' || argumentType === '-t') {
        const typeArgument = argumentType.toLowerCase();

        if (typeArgument !== 'ftb' && typeArgument !== 'hqm') {
            throw new Error(`Invalid type argument ${typeArgument}`);
        }

        type = typeArgument;
    }

    if (argumentType === '--input' || argumentType === '-i') {
        inputPath = argumentValue;
    }

    if (argumentType === '--output' || argumentType === '-o') {
        outputPath = argumentValue;
    }
}

if (!inputPath) {
    throw new Error('No input specified, use --input or -i');
}

if (!type) {
    if (fs.statSync(inputPath).isDirectory()) {
        type = 'ftb';
    } else if (inputPath.substring(inputPath.lastIndexOf('.') + 1).toLowerCase() === 'json') {
        type = 'hqm';
    } else {
        throw new Error('No type specified and couldn\'t infer from input, use --type or -t');
    }
}

if (!outputPath) {
    outputPath = './output';
}

const readFile = promisify(fs.readFile);

let conversionResult: Promise<Record<string, HeraclesQuest>>;

if (type === 'ftb') {
    conversionResult = Promise.all([
        readFile(inputPath + '/data.snbt'),
        readFile(inputPath + '/chapter_groups.snbt'),
        promisify(fs.readdir)(inputPath + '/chapters').then(chapterFiles => Promise.all(chapterFiles.map(file => readFile(file)))),
        promisify(fs.readdir)(inputPath + '/reward_tables').then(chapterFiles => Promise.all(chapterFiles.map(file => readFile(file))))
    ]).then(([fileData, chapterGroups, chapters, rewardTables]) => convertFtbQuests({
        fileData,
        chapterGroups,
        chapters,
        rewardTables
    }))
} else {
    throw new Error('HQM is not yet supported!');
}

conversionResult.then(quests =>
    Promise.all(Object.entries(quests).map(([id, quest]) =>
            promisify(fs.writeFile)(outputPath + '/' + id + '.json', JSON.stringify(quest, null, 2))
        )
    )
).catch(console.error);
