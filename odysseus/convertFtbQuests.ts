import parseStringifiedNbt from "./parseStringifiedNbt";
import {RegistryValue, ResourceLocation, TagKey} from "./types";
import {HeraclesQuest, HeraclesQuestReward, HeraclesQuestTask} from "./HeraclesQuest";
import {JsonObject} from "./Json";
import {UuidTool} from "uuid-tool";
import {QuestInputFileSystem, QuestOutputFileSystem} from "./QuestFileSystem";
import {escape} from 'he';

const enum ObserveType {
    BLOCK,
    BLOCK_TAG,
    BLOCK_STATE,
    BLOCK_ENTITY,
    BLOCK_ENTITY_TYPE,
    ENTITY_TYPE,
    ENTITY_TYPE_TAG
}

type QuestShape = 'circle' | 'square' | 'pentagon' | 'hexagon' | 'gear';

type FtbId<T extends string> = `ftbquests:${T}` | T;

type Long = string;

type Advancement = {
    type: FtbId<'advancement'>;
    advancement: ResourceLocation;
    criterion: string;
};

type Custom = {
    type: FtbId<'custom'>;
};

type ItemStack = {
    id: ResourceLocation;
    Count?: number;
};

type Item = ResourceLocation | ItemStack;

type EntityWeight = {
    passive?: number;
    monster?: number;
    boss?: number;
};

type RewardTable = BasicQuestObject & {
    empty_weight: number;
    loot_size: number;
    hide_tooltip?: boolean;
    use_title?: boolean;

    rewards: (QuestReward & {
        weight?: number;
    })[];

    loot_crate?: {
        string_id: string;
        item_name?: string;
        color: number;
        glow?: boolean;
        drops?: EntityWeight;
    };

    loot_table_id?: ResourceLocation;
};

type QuestTask = QuestObject & ({
    type: FtbId<'item'>;

    item: Item;

    count?: number;
    consume_items?: boolean;
    only_from_crafting?: boolean;
    match_nbt?: boolean;
    weak_nbt_match?: boolean;
    task_screen_only?: boolean;
} | {
    type: FtbId<'checkmark'>;
} | Advancement | {
    type: FtbId<'biome'>;
    biome: RegistryValue;
} | {
    type: FtbId<'dimension'>;
    dimension: ResourceLocation;
} | {
    type: FtbId<'energy'>;
    value: Long;
    max_input?: Long;
} | {
    type: FtbId<'fluid'>;
    fluid: ResourceLocation;
    amount: Long;
    nbt?: JsonObject;
} | {
    type: FtbId<'kill'>;
    entity: ResourceLocation;
    value: Long;
} | {
    type: FtbId<'location'>;
    dimension: ResourceLocation;
    ignore_dimension?: boolean;

    position?: [x: number, y: number, z: number];
    size?: [width: number, height: number, depth: number];
} | ({
    type: FtbId<'observation'>;
    timer: Long;
} & ({
    observe_type: ObserveType.BLOCK | ObserveType.BLOCK_ENTITY_TYPE | ObserveType.ENTITY_TYPE;
    to_observe: ResourceLocation;
} | {
    observe_type: ObserveType.BLOCK_TAG | ObserveType.ENTITY_TYPE_TAG;
    to_observe: TagKey;
} | {
    observe_type: ObserveType.BLOCK_STATE | ObserveType.BLOCK_ENTITY;
    to_observe: string;
})) | {
    type: FtbId<'stage'>;
    stage: string;
} | {
    type: FtbId<'stat'>;
    stat: ResourceLocation;
    value: number;
} | {
    type: FtbId<'structure'>;
    structure: RegistryValue;
} | {
    type: FtbId<'xp'>;
    value: Long;
    points?: boolean;
} | Custom);

type QuestReward = BasicQuestObject & (Advancement | {
    type: FtbId<'choice'>;
} | {
    type: FtbId<'command'>;
    command: string;
    player_command?: boolean;
} | {
    type: FtbId<'item'>;
    item: Item;
    count?: number;
    tag?: JsonObject;
    random_bonus?: number;
    only_one: boolean;
} | {
    type: FtbId<'loot'> | FtbId<'random'>;
    table_id: string;
    table_data?: RewardTable;
} | {
    type: FtbId<'loot'> | FtbId<'random'>;
    table: number;
    table_data?: RewardTable;
} | {
    type: FtbId<'stage'>;
    stage: string;
    remove?: boolean;
} | {
    type: FtbId<'toast'>;
    description: string;
} | {
    type: FtbId<'xp_levels'>;
    xp_levels?: number;
} | {
    type: FtbId<'xp'>;
    xp?: number;
} | Custom);

type QuestObject = {
    id: string;
    title: string;
    icon?: Item;
    tags?: string[];
    custom_id?: string;
    disable_toast?: boolean;
};

type BasicQuestObject = Omit<QuestObject, 'disable_toast'>;

type OrderIndex = {
    order_index: number;
};

type QuestFile = QuestObject & {
    default_reward_team?: boolean;
    default_consume_items?: boolean;
    default_autoclaim_rewards?: 'default' | 'disabled' | 'enabled' | 'no_toast' | 'invisible';
    default_quest_shape?: QuestShape;
    default_quest_disable_jei?: boolean;

    emergency_items?: ItemStack[];

    emergency_items_cooldown?: number;
    drop_loot_crates?: boolean;
    loot_crate_no_drop?: EntityWeight;
    disable_gui?: boolean;
    grid_scale?: number;
    pause_game?: boolean;
    lock_message?: string;
};

type ChapterGroups = {
    chapter_groups: QuestObject[];
};

type Chapter = QuestObject & {
    group: string;
    order_index: number;
    filename: string;
    subtitle?: string[];
    always_invisible?: boolean;
    default_quest_shape?: QuestShape;
    default_hide_dependency_lines?: boolean;

    images: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        image: string;
        hover?: string[];
        click?: string;
        dev?: boolean;
        corner?: boolean;
        dependency: string;
    }[];

    quests: (QuestObject & {
        x: number;
        y: number;
        shape?: QuestShape;
        subtitle?: string;
        description?: string[];
        guide_page?: string;
        hide_dependency_lines?: boolean;
        hide_dependent_lines?: boolean;
        min_required_dependencies?: number;
        dependencies?: number[] | string[];
        hide?: boolean;
        dependency_requirement: 'all_completed' | 'one_completed' | 'all_started' | 'one_started';
        hide_text_until_complete?: boolean;
        size?: number;
        optional?: boolean;
        min_width?: number;

        tasks?: QuestTask[];
        rewards?: QuestReward[];
    })[];

    quest_links: [];
};

class ConversionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

function convertIcon(icon: ResourceLocation | ItemStack) {
    return typeof icon === 'object' ? icon.id : icon;
}

function toObject<T extends QuestObject, R extends {}>(array: T[], warnings: Set<string>, convertor: (value: T) => R | null): Record<string, R> {
    return array.map(value => {
        try {
            const data = convertor(value);

            if (!data) {
                return null;
            }

            return {
                id: value.id,
                data
            };
        } catch (error: unknown) {
            if (error instanceof ConversionError) {
                warnings.add(error.message);
            } else {
                throw error;
            }
        }
    }).filter((value): value is { id: string; data: R; } => Boolean(value)).reduce((existing, current) => ({
        ...existing,
        [current.id]: current.data
    }), {});
}

function areNumericIds(array?: number[] | string[]): array is number[] {
    return typeof array?.[0] === 'number';
}

function floatCoordinateToInt(value: number) {
    return Math.round(value * 2);
}

export const convertFtbQuests = async (input: QuestInputFileSystem, output: QuestOutputFileSystem) => {
    const readSNbtFile = async (name: string) =>
        parseStringifiedNbt(await input.readFile(name), name);

    const readDirectory = async (directory: string) =>
        (await input.readDirectory(directory)).map(([data, name]) =>
            parseStringifiedNbt(data, `${directory}/${name}`)
        );

    const sortOrdered = <T extends OrderIndex>(entries: T[]) =>
        entries.sort((a, b) => a.order_index - b.order_index);

    const [
        questFile,
        groups,
        chapters,
        rewardTables
    ] = await Promise.all([
        readSNbtFile('data.snbt').then(data => data as QuestFile),
        readSNbtFile('chapter_groups.snbt').then(groups => (groups as ChapterGroups).chapter_groups),
        readDirectory('chapters').then(chapters => sortOrdered(chapters as (Chapter & OrderIndex)[])),
        readDirectory('reward_tables').then(tables => sortOrdered(tables as (RewardTable & OrderIndex)[]))
    ]);

    const outputGroups: string[] = [];

    const groupedChapters = chapters.reduce<Record<string, Chapter[]>>((grouped, chapter) => {
        const key = chapter.group ?? '';

        return {
            ...grouped,
            [key]: [...(grouped[key] ?? []), chapter]
        };
    }, {});

    const fileWrites: Promise<void>[] = [];
    const warnings = new Set<string>();

    for (const group of [...groups, null]) {
        for (const chapter of groupedChapters[group?.id ?? ''] ?? []) {
            outputGroups.push(chapter.title);

            for (const quest of chapter.quests) {
                const heraclesQuest: HeraclesQuest = {
                    settings: {
                        hidden: quest.hide
                    },

                    dependencies: areNumericIds(quest.dependencies) ?
                        quest.dependencies.map(id => id.toString(16).toUpperCase()) :
                        quest.dependencies,

                    tasks: toObject(quest.tasks ?? [], warnings, task => convertTask(task, questFile)),
                    rewards: toObject(quest.rewards ?? [], warnings, reward => convertReward(reward, rewardTables)),

                    display: {
                        title: quest.title,
                        description: [
                            `<h1>${quest.title}</h1>`,
                            '<hl>',
                            '</hl>',
                            ...quest.subtitle ? [
                                quest.subtitle,
                                '<br>',
                                '</br>'
                            ] : [],
                            ...quest.description ?? []
                        ].map(escape),

                        icon: quest.icon ? {
                            type: 'heracles:item',
                            item: convertIcon(quest.icon)
                        } : undefined,

                        icon_background: (quest.shape ?? chapter.default_quest_shape ?? questFile.default_quest_shape) === 'circle' ? 'heracles:textures/gui/quest_backgrounds/circles.png' : undefined,

                        subtitle: quest.subtitle ? {
                            text: quest.subtitle
                        } : undefined,

                        groups: {
                            [chapter.title]: {
                                position: [
                                    floatCoordinateToInt(quest.x),
                                    floatCoordinateToInt(quest.y)
                                ]
                            }
                        }
                    }
                };

                const groupPart = group?.title ? `${group.title}/` : '';
                const chapterPart = chapter.title.toLowerCase().replaceAll(/[^a-z0-9]/g, '');

                fileWrites.push(output.writeFile(`${groupPart}${chapterPart.length ? chapterPart : chapter.title}/${quest.id}.json`, JSON.stringify(heraclesQuest, null, 2)));
            }
        }
    }

    await Promise.all([
        ...fileWrites,
        output.writeFile(`groups.txt`, outputGroups.join('\n'))
    ]);

    return [...warnings];
}

function parseBigInt(string: string, radix?: number) {
    if (!radix) {
        return BigInt(string);
    }

    const bigintRadix = BigInt(radix);
    return [...string].reduce((previousValue, digit) => previousValue * bigintRadix + BigInt('0123456789abcdefghijklmnopqrstuvwxyz'.indexOf(digit)), 0n);
}

function convertTask(task: QuestTask, questFile: QuestFile): HeraclesQuestTask {
    switch (task.type) {
        case "ftbquests:checkmark":
        case "checkmark": {
            const id = parseBigInt(task.id, 16);

            return {
                type: 'heracles:check',
                value: UuidTool.toString([...new Uint8Array(BigUint64Array.from([id, id]).buffer)])
            };
        }
        case "ftbquests:item":
        case "item":
            let collectionType: 'manual' | 'consume' | undefined = undefined;

            if (task.consume_items === true || questFile.default_consume_items === true) {
                collectionType = 'consume'
            } else if (task.consume_items === false || questFile.default_consume_items === false) {
                collectionType = 'manual'
            }

            return {
                type: 'heracles:item',
                amount: task.count,
                item: typeof task.item === 'object' ? task.item.id : task.item,
                collection_type: collectionType
            };
        case "ftbquests:advancement":
        case "advancement":
            return {
                type: 'heracles:advancement',
                advancements: [task.advancement]
            };
        case "ftbquests:biome":
        case "biome":
            return {
                type: 'heracles:biome',
                biomes: task.biome
            };
        case "ftbquests:dimension":
        case "dimension":
            return {
                type: 'heracles:changed_dimension',
                to: task.dimension
            }
        case "ftbquests:kill":
        case "kill":
            return {
                type: 'heracles:kill_entity',
                amount: parseInt(task.value),
                entity: {
                    type: task.entity
                }
            };
        case "ftbquests:location":
        case "location":
            const convertCoordinate = (index: number) => {
                const base = task.position?.[index];
                const size = task.size?.[index];

                if (base && size) {
                    return {
                        min: base - size / 2,
                        max: base + size / 2
                    };
                }

                return base;
            }

            return {
                type: 'heracles:location',

                icon: task.icon ? convertIcon(task.icon) : undefined,

                title: {
                    text: task.title
                },

                description: {
                    text: ''
                },

                predicate: {
                    position: {
                        x: convertCoordinate(0),
                        y: convertCoordinate(1),
                        z: convertCoordinate(2)
                    }
                }
            }
        case "ftbquests:stat":
        case "stat":
            return {
                type: 'heracles:stat',
                stat: task.stat,
                target: task.value
            }
        case "ftbquests:structure":
        case "structure":
            return {
                type: 'heracles:structure',
                structures: task.structure
            };
        case "ftbquests:observation":
        case "observation": {
            switch (task.observe_type) {
                case ObserveType.BLOCK:
                case ObserveType.BLOCK_ENTITY_TYPE:
                case ObserveType.BLOCK_TAG:
                    return {
                        type: 'heracles:block_interaction',
                        block: task.to_observe
                    };
                case ObserveType.BLOCK_STATE:
                case ObserveType.BLOCK_ENTITY:
                    const stateStart = task.to_observe.indexOf('[');
                    const stateEnd = task.to_observe.indexOf(']');

                    const block = task.to_observe.substring(0, stateStart).trim() as ResourceLocation;

                    const nbtStart = task.to_observe.indexOf('{');
                    const stateString = task.to_observe.substring(stateStart + 1, stateEnd);
                    const nbtString = nbtStart >= 0 ? task.to_observe.substring(nbtStart + 1, task.to_observe.lastIndexOf('}')) : null;

                    const state: Record<string, string> = stateString.split(',')
                        .map(property => property.split('='))
                        .reduce((existingState, property) => ({
                            ...existingState,
                            [property[0]]: property[1]
                        }), {})

                    if (nbtString) {
                        return {
                            type: 'heracles:block_interaction',
                            block,
                            state,
                            nbt: JSON.parse(nbtString) as JsonObject
                        }
                    }

                    return {
                        type: 'heracles:block_interaction',
                        block,
                        state
                    }
                case ObserveType.ENTITY_TYPE:
                case ObserveType.ENTITY_TYPE_TAG:
                    return {
                        type: 'heracles:entity_interaction',
                        entity: task.to_observe
                    }
            }

            break;
        }
        default:
            throw new ConversionError(`Don't know how to convert task of type ${task.type}.`);
    }
}

function convertReward(reward: QuestReward, rewardTables: (RewardTable & OrderIndex)[]): HeraclesQuestReward | null {
    switch (reward.type) {
        case "ftbquests:command":
        case "command":
            return {
                type: 'heracles:command',
                command: reward.command
            }
        case "ftbquests:item":
        case "item":
            const item = typeof reward.item === 'object' ? reward.item : {id: reward.item}

            return {
                type: 'heracles:item',
                item: {
                    id: item.id,
                    count: reward.count ?? item.Count,
                    nbt: reward.tag
                }
            }
        case 'ftbquests:random':
        case 'random':
        case "ftbquests:loot":
        case "loot": {
            let rewardTable: RewardTable | undefined;

            if ('table' in reward) {
                rewardTable = rewardTables.find(table => table.order_index === reward.table);
            } else if ('table_id' in reward) {
                rewardTable = rewardTables.find(table => table.id === reward.table_id);
            }

            if (!rewardTable && reward.table_data) {
                rewardTable = reward.table_data;
            }

            if (!rewardTable) {
                return null;
            }

            if (rewardTable.loot_table_id) {
                return {
                    type: 'heracles:loottable',
                    loot_table: rewardTable.loot_table_id
                };
            } else {
                throw new ConversionError(`Don't know how to convert reward ${reward}`);
            }
        }
        case "ftbquests:xp_levels":
        case "xp_levels":
            return {
                type: 'heracles:xp',
                xptype: 'level',
                amount: reward.xp_levels ?? 5
            }
        case "ftbquests:xp":
        case "xp":
            return {
                type: 'heracles:xp',
                xptype: 'points',
                amount: reward.xp ?? 100
            }
        default:
            throw new ConversionError(`Don't know how to convert reward of type ${reward.type}.`);
    }
}
