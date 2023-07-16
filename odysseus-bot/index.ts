import express, {Request} from 'express';
import nacl from 'tweetnacl';
import {
    APIApplicationCommandInteractionDataAttachmentOption,
    APIApplicationCommandInteractionDataOption,
    APIApplicationCommandInteractionDataStringOption,
    APIDMInteraction, APIEmbed,
    APIGuildInteraction,
    APIInteractionResponse,
    APIPingInteraction,
    ApplicationCommandType,
    InteractionResponseType,
    InteractionType,
    MessageFlags, RESTPatchAPIWebhookWithTokenMessageJSONBody,
    Routes
} from 'discord-api-types/v10';
import JSZip from "jszip";
import axios from "axios";
import {REST} from "@discordjs/rest";
import {convertFtbQuests, QuestInputFileSystem, QuestOutputFileSystem} from 'odysseus';
import {EmbedBuilder} from "@discordjs/builders";

const publicKey = process.env.CLIENT_PUBLIC_KEY;
const discordToken = process.env.DISCORD_TOKEN;
const port = process.env.PORT ? parseInt(process.env.PORT) : 80;

if (!publicKey) {
    throw new Error('CLIENT_PUBLIC_KEY was not defined.');
}

if (!discordToken) {
    throw new Error('DISCORD_TOKEN was not defined.');
}

const app = express();
const rest = new REST().setToken(discordToken);

app.use(express.text({type: '*/*'}));

async function handleInteraction(interaction: APIPingInteraction | APIDMInteraction | APIGuildInteraction, respond: (response: APIInteractionResponse) => void) {
    if (interaction.type === InteractionType.Ping) {
        return respond({type: InteractionResponseType.Pong});
    }

    if (!(interaction.type === InteractionType.ApplicationCommand && interaction.data.type === ApplicationCommandType.ChatInput)) {
        return;
    }

    const options = interaction.data.options;

    const getOption = <T extends APIApplicationCommandInteractionDataOption>(name: string) => options?.find((option): option is T => option.name === name)

    const questDataOption = getOption<APIApplicationCommandInteractionDataAttachmentOption>('quest-file');
    const typeOption = getOption<APIApplicationCommandInteractionDataStringOption>('type');
    const questDataAttachment = questDataOption ? interaction.data.resolved?.attachments?.[questDataOption.value] : undefined;

    if (!questDataAttachment) {
        return respond({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: 'No quest file specified.',
                flags: MessageFlags.Ephemeral
            }
        });
    }

    let type: 'ftb' | 'hqm';

    if (typeOption) {
        if (typeOption.value !== 'ftb' && typeOption.value !== 'hqm') {
            return respond({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `Invalid quest type ${typeOption.value}`,
                    flags: MessageFlags.Ephemeral
                }
            });
        }

        type = typeOption.value;
    } else if (questDataAttachment.filename.endsWith('.zip')) {
        type = 'ftb';
    } else {
        type = 'hqm';
    }

    if (type === 'hqm') {
        return respond({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `HQM quests are not yet supported!`,
                flags: MessageFlags.Ephemeral
            }
        });
    }

    const buffer = await axios.get(questDataAttachment.url, {responseType: 'arraybuffer'}).then(response => Buffer.from(response.data, 'binary'));
    const inputZip = await JSZip.loadAsync(buffer);
    const outputZip = new JSZip();

    const inputFileSystem: QuestInputFileSystem = {
        readFile(name: string) {
            const file = inputZip.file(name);

            if (!file) {
                throw new Error(`File not found: ${name}`);
            }

            return file.async('text');
        },

        readDirectory(name: string) {
            const folder = inputZip.folder(name);

            if (!folder) {
                throw new Error(`Directory not found: ${name}`);
            }

            const fileContents: Promise<[data: string, name: string]>[] = [];

            folder.forEach((name, file) => fileContents.push(file.async('text').then(data => [data, name])));

            return Promise.all(fileContents);
        }
    };

    const outputFileSystem: QuestOutputFileSystem = {
        writeFile(name: string, data: string) {
            outputZip.file(name, data);

            return Promise.resolve();
        }
    };

    respond({
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {flags: MessageFlags.Ephemeral}
    });

    const warningsEmbed = new EmbedBuilder().setTitle('Errors Encountered');
    const warnings = await convertFtbQuests(inputFileSystem, outputFileSystem);

    if (warnings.length) {
        warningsEmbed.setDescription(warnings.join('\n\n'));
    } else {
        warningsEmbed.setDescription('None! :)');
    }

    const body: RESTPatchAPIWebhookWithTokenMessageJSONBody = {
        content: 'The resulting quest-pack is attached below.',
        attachments: [{id: '0'}],
        embeds: [warningsEmbed.toJSON()]
    };

    await rest.patch(Routes.webhookMessage(interaction.application_id, interaction.token), {
        body,
        files: [{
            name: 'quests.zip',
            data: Buffer.from(await outputZip.generateAsync({type: 'binarystring'}), 'binary'),
            contentType: 'application/zip'
        }]
    });
}

app.post('/', async (request: Request<object, unknown, string, APIInteractionResponse>, response) => {
    const signature = request.get('X-Signature-Ed25519');
    const timestamp = request.get('X-Signature-Timestamp');

    if (!request.body || !signature || !timestamp) {
        response.status(401).end('Invalid Request Signature');
        return;
    }

    const isVerified = nacl.sign.detached.verify(
        Buffer.from(timestamp + request.body),
        Buffer.from(signature, 'hex'),
        Buffer.from(publicKey, 'hex')
    );

    if (!isVerified) {
        response.status(401).end('Invalid Request Signature');
        return;
    }

    let responded = false;

    const interaction: APIPingInteraction | APIDMInteraction | APIGuildInteraction = JSON.parse(request.body);

    try {
        await handleInteraction(interaction, interactionResponse => {
            responded = true;

            response.json(interactionResponse);
        });
    } catch (error: unknown) {
        console.error(error);

        const message = error && typeof error === 'object' && 'message' in error ? `${error.message}` : null;

        const data = {
            content: `An error has occurred: ${message}`,
            flags: MessageFlags.Ephemeral
        };

        if (responded) {
            await rest.patch(Routes.webhookMessage(interaction.application_id, interaction.token), {body: data});
        } else {
            const interactionResponse: APIInteractionResponse = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data
            };

            response.json(interactionResponse);
        }
    }
});

app.listen(port, () => console.info('Awaiting Interactions'));
