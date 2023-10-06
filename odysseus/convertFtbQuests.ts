import parseStringifiedNbt from "./parseStringifiedNbt";
import {RegistryValue, ResourceLocation, TagKey} from "./types";
import {HeraclesQuest, HeraclesQuestIcon, HeraclesQuestReward, HeraclesQuestTask} from "./HeraclesQuest";
import {JsonObject} from "./Json";
import {QuestInputFileSystem, QuestOutputFileSystem} from "./QuestFileSystem";
import * as Hex from "./Hex";

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
    tag?: JsonObject;
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

    rewards: {
        item: ResourceLocation;
        count?: number;
        tag?: JsonObject;
        weight?: number;
    }[];

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

    count?: string;
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
    amount: string;
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
    table_id: string;
    table_data?: RewardTable;
} | {
    type: FtbId<'command'>;
    command: string;
    player_command?: boolean;
} | {
    type: FtbId<'item'>;
    item: Item;
    count?: string;
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
    title?: string;
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

function convertIcon(icon: ResourceLocation | ItemStack): HeraclesQuestIcon {
    return {
        type: 'heracles:item',
        item: typeof icon === 'object' ? icon.id : icon
    }
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
    return Math.round(value * 32);
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

    const formatString = (text: string) => {
        let result = '';

        for (let i = 0; i < text.length; ++i) {
            const character = text.charAt(i);

            if (character === '\\') {
                result += text.charAt(++i);

                continue;
            }

            if (character === '&') {
                result += '§';

                continue;
            }

            result += character;
        }

        return result;
    };

    for (const group of [...groups, null]) {
        const groupTitle = group?.title ? formatString(group.title) : undefined;

        for (const chapter of groupedChapters[group?.id ?? ''] ?? []) {
            const chapterTitle = chapter.title ? formatString(chapter.title) : undefined;

            if (chapterTitle) {
                outputGroups.push(chapterTitle);
            }

            for (const quest of chapter.quests) {
                const tasks = toObject(quest.tasks ?? [], warnings, task => convertTask(task, questFile));
                const rewards = toObject(quest.rewards ?? [], warnings, reward => convertReward(reward, rewardTables));

                const taskIds = Object.keys(tasks);
                const rewardsIds = Object.keys(rewards);

                const inferData = () => {
                    if (taskIds.length === 1) {
                        const task = tasks[taskIds[0]];
                        switch (task.type) {
                            case 'heracles:item':
                            case 'heracles:item_interaction':
                            case 'heracles:item_use':
                                return {
                                    title: `Acquire: ${task.item}`,
                                    icon: task.item.startsWith('#') ? undefined : task.item
                                };
                            case 'heracles:stat':
                                return {
                                    title: `Increase ${task.stat}`,
                                    icon: 'minecraft:spyglass' as ResourceLocation
                                };
                            case 'heracles:changed_dimension':
                                return {
                                    title: `Visit ${task.to}`,
                                    icon: 'minecraft:netherrack' as ResourceLocation
                                };
                            case 'heracles:advancement':
                                return {
                                    title: `Complete ${task.advancements.length == 0 ? 'Advancement' : task.advancements[0]}`,
                                    icon: 'minecraft:knowledge_book' as ResourceLocation
                                };
                            case 'heracles:structure':
                                return {
                                    title: `Find ${task.structures.length == 0 ? 'Structure' : task.structures[0]}`,
                                    icon: 'minecraft:structure_block' as ResourceLocation
                                };
                            case 'heracles:biome':
                                return {
                                    title: `Visit ${task.biomes.length == 0 ? 'Biome' : task.biomes[0]}`,
                                    icon: 'minecraft:birch_sapling' as ResourceLocation
                                };
                        }
                    }
                }

                const inferredData = inferData();
                const questTitle = quest.title ? formatString(quest.title) : inferredData?.title;
                const questSubtitle = quest.subtitle ? formatString(quest.subtitle) : undefined;
                const questIcon = quest.icon ?? inferredData?.icon;

                const heraclesQuest: HeraclesQuest = {
                    settings: {
                        hidden: quest.hide
                    },

                    dependencies: areNumericIds(quest.dependencies) ?
                        quest.dependencies.map(id => id.toString(16).toUpperCase()) :
                        quest.dependencies,

                    tasks,
                    rewards,

                    display: {
                        title: questTitle,
                        description: [
                            ...questSubtitle ? [
                                `<h2>${questSubtitle}</h2>`,
                                '<hr/>',
                            ] : [],

                            ...taskIds.length ? [
                                ...taskIds.map(taskId => `<task task="${taskId}" quest="${quest.id}"/>`),
                                '<hr/>',
                            ] : [],

                            ...quest.description?.map(formatString)?.map(s => s.length ? s : '<br/>') ?? [],

                            ...rewardsIds.length ? [
                                '<hr/>',
                                ...rewardsIds.map(rewardId => `<reward reward="${rewardId}" quest="${quest.id}"/>`)
                            ] : [],
                        ],

                        icon: questIcon ? convertIcon(questIcon) : undefined,

                        icon_background: (quest.shape ?? chapter.default_quest_shape ?? questFile.default_quest_shape) === 'circle' ?
                            'heracles:textures/gui/quest_backgrounds/circles.png' :
                            undefined,

                        subtitle: questSubtitle ? {
                            text: questSubtitle
                        } : undefined,

                        groups: chapterTitle ? {
                            [chapterTitle]: {
                                position: [
                                    floatCoordinateToInt(quest.x),
                                    floatCoordinateToInt(quest.y)
                                ]
                            }
                        } : undefined
                    }
                };

                const groupPart = groupTitle ? `${groupTitle}/` : '';
                const chapterPart = chapterTitle?.toLowerCase().replaceAll(/[^a-z0-9]/g, '');

                fileWrites.push(output.writeFile(`quests/${groupPart}${chapterPart?.length ? chapterPart : chapter.title}/${quest.id}.json`, JSON.stringify(heraclesQuest, null, 2)));
            }
        }
    }

    await Promise.all([
        ...fileWrites,
        output.writeFile(`groups.txt`, outputGroups.join('\n'))
    ]);

    return [...warnings];
}

function convertTask(task: QuestTask, questFile: QuestFile): HeraclesQuestTask {
    switch (task.type) {
        case "ftbquests:checkmark":
        case "checkmark": {
            return {
                type: 'heracles:check',
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
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

            if (typeof task.item === 'object') {
                if (task.item.id === 'itemfilters:tag' && task.item.tag?.value) {
                    return {
                        type: 'heracles:item',
                        title: task.title,
                        icon: task.icon ? convertIcon(task.icon) : undefined,
                        amount: task.count ? parseInt(task.count) : undefined,
                        item: `#${task.item.tag?.value as ResourceLocation}`,
                        collection_type: collectionType
                    }
                }

                if (task.item.id === 'ftbquests:book') {
                    return {
                        type: 'heracles:item',
                        title: task.title,
                        icon: task.icon ? convertIcon(task.icon) : undefined,
                        amount: task.count ? parseInt(task.count) : undefined,
                        item: `heracles:quest_book`,
                        collection_type: collectionType
                    }
                }

                return {
                    type: 'heracles:item',
                    title: task.title,
                    icon: task.icon ? convertIcon(task.icon) : undefined,
                    amount: task.count ? parseInt(task.count) : undefined,
                    item: task.item.id,
                    collection_type: collectionType,
                    nbt: task.item.tag
                };
            } else {
                return {
                    type: 'heracles:item',
                    title: task.title,
                    icon: task.icon ? convertIcon(task.icon) : undefined,
                    amount: task.count ? parseInt(task.count) : undefined,
                    item: task.item,
                    collection_type: collectionType
                };
            }
        case "ftbquests:advancement":
        case "advancement":
            return {
                type: 'heracles:advancement',
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
                advancements: [task.advancement]
            };
        case "ftbquests:biome":
        case "biome":
            return {
                type: 'heracles:biome',
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
                biomes: task.biome
            };
        case "ftbquests:dimension":
        case "dimension":
            return {
                type: 'heracles:changed_dimension',
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
                from: 'minecraft:overworld',
                to: task.dimension
            }
        case "ftbquests:kill":
        case "kill":
            return {
                type: 'heracles:kill_entity',
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
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
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
                description: '',
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
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
                stat: task.stat,
                target: task.value
            }
        case "ftbquests:structure":
        case "structure":
            return {
                type: 'heracles:structure',
                title: task.title,
                icon: task.icon ? convertIcon(task.icon) : undefined,
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
                        title: task.title,
                        icon: task.icon ? convertIcon(task.icon) : undefined,
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
                            title: task.title,
                            icon: task.icon ? convertIcon(task.icon) : undefined,
                            block,
                            state,
                            nbt: JSON.parse(nbtString) as JsonObject
                        }
                    }

                    return {
                        type: 'heracles:block_interaction',
                        title: task.title,
                        icon: task.icon ? convertIcon(task.icon) : undefined,
                        block,
                        state
                    }
                case ObserveType.ENTITY_TYPE:
                case ObserveType.ENTITY_TYPE_TAG:
                    return {
                        type: 'heracles:entity_interaction',
                        title: task.title,
                        icon: task.icon ? convertIcon(task.icon) : undefined,
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
                title: reward.title,
                icon: reward.icon ? convertIcon(reward.icon) : undefined,
                type: 'heracles:command',
                command: reward.command
            }
        case "ftbquests:item":
        case "item":
            const item = typeof reward.item === 'object' ? reward.item : {id: reward.item}

            return {
                type: 'heracles:item',
                title: reward.title,
                icon: reward.icon ? convertIcon(reward.icon) : undefined,
                item: {
                    id: item.id,
                    count: (reward.count ? parseInt(reward.count) : undefined) ?? (item.Count ? parseInt(item.Count.toString()) : undefined),
                    nbt: reward.tag ?? item.tag
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
                    title: reward.title,
                    icon: reward.icon ? convertIcon(reward.icon) : undefined,
                    loot_table: rewardTable.loot_table_id
                };
            } else {
                throw new ConversionError(`Don't know how to convert reward ${reward}`);
            }
        }
        case "choice": {
            let rewardTable: RewardTable | undefined;

            if ('table_id' in reward) {
                rewardTable = rewardTables.find(table => table.id === Hex.decToHex(reward.table_id));
            }

            if (!rewardTable && reward.table_data) {
                rewardTable = reward.table_data;
            }

            if (!rewardTable) {
                return null;
            }

            if (rewardTable.rewards) {
                let rewards: Record<string, HeraclesQuestReward> = {};
                rewardTable.rewards.forEach((tableReward, i) => {
                    rewards[reward.id + '_' + i] = {
                        type: 'heracles:item',
                        item: {
                            id: tableReward.item,
                            count: tableReward.count,
                            nbt: tableReward.tag
                        }
                        };
                });
                return {
                    type: 'heracles:selectable',
                    rewards: rewards
                };
            } else {
                throw new ConversionError(`Don't know how to convert reward ${reward}`);
            }
        }
        case "ftbquests:xp_levels":
        case "xp_levels":
            return {
                type: 'heracles:xp',
                title: reward.title,
                icon: reward.icon ? convertIcon(reward.icon) : undefined,
                xptype: 'level',
                amount: reward.xp_levels ?? 5
            }
        case "ftbquests:xp":
        case "xp":
            return {
                type: 'heracles:xp',
                title: reward.title,
                icon: reward.icon ? convertIcon(reward.icon) : undefined,
                xptype: 'points',
                amount: reward.xp ?? 100
            }
        default:
            throw new ConversionError(`Don't know how to convert reward of type ${reward.type}.`);
    }
}
