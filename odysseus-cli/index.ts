import process from 'process';
import fs from "fs";
import {promisify} from "util";
import {convertFtbQuest} from "odysseus";

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
    const extension = inputPath.substring(inputPath.lastIndexOf('.') + 1).toLowerCase();

    if (extension === 'snbt') {
        type = 'ftb';
    } else if (extension === 'json') {
        type = 'hqm';
    } else {
        throw new Error('No type specified and couldn\'t infer from input, use --type or -t');
    }
}

if (!outputPath) {
    outputPath = './output';
}

const convertHqmQuest = (): never => {
    throw new Error('HQM is not yet supported!');
}

promisify(fs.readFile)(inputPath)
    .then(type === 'ftb' ? convertFtbQuest : convertHqmQuest)
    .then(quests => {

    })
    .catch(console.error);
