import process from 'process';
import fs from "fs";
import {promisify} from "util";
import {convertFtbQuests, QuestInputFileSystem, QuestOutputFileSystem} from "odysseus";

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
const mkdir = promisify(fs.mkdir);
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

const inputFileSystem: QuestInputFileSystem = {
    async readFile(name: string) {
        return (await readFile(`${inputPath}/${name}`)).toString();
    },

    async readDirectory(name: string) {
        const path = `${inputPath}/${name}`;
        const doesExist = await exists(path);

        return doesExist ? Promise.all((await readDir(path)).map(async file => [(await readFile(`${path}/${file}`)).toString(), file])) : [];
    }
};

const outputFileSystem: QuestOutputFileSystem = {
    async writeFile(name: string, data: string) {
        const path = `${output}/${name}`;

        await mkdir(path.substring(0, path.lastIndexOf('.')), {recursive: true});

        return writeFile(path, data);
    },
};

if (type === 'ftb') {
    convertFtbQuests(inputFileSystem, outputFileSystem)
        .then(warnings => console.warn(warnings.join('\n')))
        .catch(console.error);
} else {
    throw new Error('HQM is not yet supported!');
}
