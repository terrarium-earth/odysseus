import parseStringifiedNbt from "./parseStringifiedNbt";
import {RegistryValue, ResourceLocation} from "./types";
import {HeraclesQuest, HeraclesQuestReward, HeraclesQuestTask} from "./HeraclesQuest";
import {JsonObject} from "./Json";
import {UuidTool} from "uuid-tool";

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

type RewardTable = QuestObject & {
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
} | {
    type: FtbId<'observation'>;
    timer: Long;
    observe_type: ObserveType;
    to_observe: string;
} | {
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

type QuestReward = QuestObject & (Advancement | {
    type: FtbId<'choice'>;
} | {
    type: FtbId<'command'>;
    command: string;
    player_command?: boolean;
} | {
    type: FtbId<'item'>;
    item: Item;
    count?: number;
    random_bonus?: number;
    only_one: boolean;
} | {
    type: FtbId<'loot'>;
    table_id: string;
    table_data?: RewardTable;
} | {
    type: FtbId<'loot'>;
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
    icon: Item;
    tags?: string[];
    custom_id?: string;
    disable_toast?: boolean;
}

type QuestFile = QuestObject & {
    default_reward_team: boolean;
    default_consume_items: boolean;
    default_autoclaim_rewards: 'default' | 'disabled' | 'enabled' | 'no_toast' | 'invisible';
    default_quest_shape: QuestShape;
    default_quest_disable_jei: boolean;

    emergency_items?: ItemStack[];

    emergency_items_cooldown: number;
    drop_loot_crates: boolean;
    loot_crate_no_drop?: EntityWeight;
    disable_gui?: boolean;
    grid_scale?: number;
    pause_game?: boolean;
    lock_message?: string;
}

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
        tasks: QuestTask[];
        rewards: QuestReward[];
    })[];

    quest_links: [];
};

function toObject<T extends QuestObject, R>(array: T[], convertor: (value: T) => R): Record<string, R> {
    return array.map(value => {
        return {
            id: value.id,
            data: convertor(value)
        }
    }).reduce((existing, current) => ({
        ...existing,
        [current.id]: current.data
    }), {});
}

export const convertFtbQuest = async (data: Buffer): Promise<Record<string, HeraclesQuest>> => {
    const parsedResult = parseStringifiedNbt(data.toString());

    if (!parsedResult || typeof parsedResult !== 'object') {
        throw new Error('Invalid quest file.');
    }

    const chapter = parsedResult as Chapter; // Unsafe cast, anything invalid is user error and will likely fail regardless.

    const group = chapter.title;

    return toObject(chapter.quests, quest => ({
        settings: {
            hidden: quest.hide
        },

        // dependencies: quest.dependencies,

        tasks: toObject(quest.tasks, convertTask),
        rewards: toObject(quest.rewards, convertReward),

        display: {
            title: quest.title,
            description: quest.description,

            subtitle: quest.subtitle ? {
                text: quest.subtitle
            } : undefined,

            groups: {
                [group]: {
                    position: {
                        x: quest.x,
                        y: quest.y
                    }
                }
            }
        }
    }));
}

function parseBigInt(string: string, radix?: number) {
    if (!radix) {
        return BigInt(string);
    }

    const bigintRadix = BigInt(radix);
    return [...string].reduce((previousValue, digit) => previousValue * bigintRadix + BigInt('0123456789abcdefghijklmnopqrstuvwxyz'.indexOf(digit)), 0n);
}

function convertTask(task: QuestTask): HeraclesQuestTask {
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
            return {
                type: 'heracles:item',
                amount: task.count,
                item: typeof task.item === 'object' ? task.item.id : task.item
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
        case "ftbquests:structure":
        case "structure":
            return {
                type: 'heracles:structure',
                structures: task.structure
            };
        default:
            throw new Error(`Don't know how to convert task of type ${task.type}.`);
    }
}

function convertReward(reward: QuestReward): HeraclesQuestReward {
    switch (reward.type) {
        case "ftbquests:command":
        case "command":
            return {
                type: 'heracles:command',
                command: reward.command
            }
        case "ftbquests:item":
        case "item":
            return {
                type: 'heracles:item',
                item: reward.item
            }
        case "ftbquests:loot":
        case "loot":
            if (reward.table_data && reward.table_data.loot_table_id) {
                return {
                    type: 'heracles:loottable',
                    loot_table: reward.table_data.loot_table_id
                };
            } else {
                // TODO Handle reward table IDs and indices
                throw new Error(`Don't know how to convert reward ${reward}`);
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
            throw new Error(`Don't know how to convert reward of type ${reward.type}.`);
    }
}
