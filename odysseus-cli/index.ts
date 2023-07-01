import process from 'process';
import fs from "fs";
import {promisify} from "util";
import {ConversionResult, convertFtbQuests, HeraclesQuest} from "odysseus";

const args = process.argv.slice(2);

let type: 'ftb' | 'hqm' | null = null;
let inputPath: string | null = null;
let outputPath: string | null = null;

for (let i = 0; i < args.length; ++i) {
    const argument = args[i];
    const equals = argument.indexOf('=');

    let argumentType: string;
    let argumentValue: string;

    if (equals >= 0) {
        argumentType = argument.substring(0, equals).toLowerCase();
        argumentValue = argument.substring(equals + 1);
    } else {
        argumentType = args[i].toLowerCase();
        const nextArgument = args[(i++) + 1];

        if (!nextArgument) {
            throw new Error('Invalid argument list, no value provided for ' + argumentType);
        }

        argumentValue = nextArgument;
    }

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

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const exists = promisify(fs.exists);

if (!type) {
    if (fs.statSync(inputPath).isDirectory()) {
        type = 'ftb';
    } else if (inputPath.substring(inputPath.lastIndexOf('.') + 1).toLowerCase() === 'json') {
        type = 'hqm';
    } else {
        throw new Error('No type specified and couldn\'t infer from input, use --type or -t');
    }
}

const output = outputPath ?? './output';

let conversionResult: Promise<ConversionResult>;

const readDirSafely = (directory: string) => exists(directory).then(exists => exists ?
    readDir(directory).then(files =>
        files.map(file => `${directory}/${file}`)
    ) :
    []
);

if (type === 'ftb') {
    conversionResult = Promise.all([
        readFile(`${inputPath}/data.snbt`),
        readFile(`${inputPath}/chapter_groups.snbt`),
        readDirSafely(`${inputPath}/chapters`).then(chapterFiles => Promise.all(chapterFiles.map(file => readFile(file)))),
        readDirSafely(`${inputPath}/reward_tables`).then(chapterFiles => Promise.all(chapterFiles.map(file => readFile(file))))
    ]).then(([fileData, chapterGroups, chapters, rewardTables]) => convertFtbQuests({
        fileData,
        chapterGroups,
        chapters,
        rewardTables
    }))
} else {
    throw new Error('HQM is not yet supported!');
}

conversionResult.then(result => {
    const write = () =>
        Promise.all([
            ...Object.entries(result.quests).map(([id, quest]) =>
                writeFile(`${output}/${id}.json`, JSON.stringify(quest, null, 2))),

            writeFile(`${output}/groups.txt`, result.groups.join('\n'))
        ]);

    return exists(output).then(exists => exists ? write() : promisify(fs.mkdir)(output).then(write))
}).catch(console.error);
