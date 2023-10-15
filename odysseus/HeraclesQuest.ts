import {Component} from "./Component";
import {JsonObject} from "./Json";
import {RegistryValue, ResourceLocation} from "./types";

type NumericRange = number | null | {
    min?: number;
    max?: number;
}

type StateProperties = Record<string, string | {
    min?: string;
    max?: string;
}>;

type LocationPredicate = {
    position?: {
        x?: NumericRange;
        y?: NumericRange;
        z?: NumericRange;
    };

    dimension?: ResourceLocation;
    structure?: ResourceLocation;
    biome?: ResourceLocation;
    smokey?: boolean;

    light?: {
        light: NumericRange;
    } | null;

    block?: {
        nbt?: string | null;
        blocks?: ResourceLocation[];
        tag?: ResourceLocation;
        state?: {
            properties: StateProperties;
        } | null;
    } | null;

    fluid?: {
        fluid?: ResourceLocation;
        tag?: ResourceLocation;
        state?: {
            properties: StateProperties;
        } | null;
    } | null;
} | null;

type EffectsPredicate = Record<ResourceLocation, {
    amplifier?: NumericRange;
    duration?: NumericRange;
    ambient?: boolean;
    visible?: boolean;
}> | null;

type EntityFlags = {
    is_on_fire?: boolean;
    is_sneaking?: boolean;
    is_sprinting?: boolean;
    is_swimming?: boolean;
    is_baby?: boolean;
} | null;

type EnchantmentPredicate = {
    enchantment: ResourceLocation;
    levels: NumericRange;
} | null;

type EnchantmentsPredicate = EnchantmentPredicate[] | null;

type ItemPredicate = {
    count?: NumericRange;
    durability?: NumericRange;
    nbt?: string | null;
    items?: ResourceLocation[];
    tag?: ResourceLocation;
    potion?: ResourceLocation;
    enchantments?: EnchantmentsPredicate;
    stored_enchantments?: EnchantmentsPredicate;
} | null;

type EntityPredicate = {
    type: RegistryValue;

    distance?: {
        x: NumericRange;
        y: NumericRange;
        z: NumericRange;
        horizontal: NumericRange;
        absolute: NumericRange;
    } | null;

    location?: LocationPredicate;
    stepping_on?: LocationPredicate;
    effects?: EffectsPredicate;
    nbt?: string | null;
    flags?: EntityFlags;
    equipment?: {
        head?: ItemPredicate;
        chest?: ItemPredicate;
        legs?: ItemPredicate;
        feet?: ItemPredicate;
        mainhand?: ItemPredicate;
        offhand?: ItemPredicate;
    } | null;
    type_specific?: {
        type?: 'any';
    } | {
        type: 'lightning';
        blocks_set_on_fire?: NumericRange;
        entity_struck?: EntityPredicate;
    } | {
        type: 'fishing_hook';
        in_open_water?: boolean;
    } | {
        type: 'player';
        level?: NumericRange;
        gamemode?: 'survival' | 'creative' | 'adventure' | 'spectator';
        stats?: {
            type: ResourceLocation;
            stat: ResourceLocation;
            value: NumericRange;
        }[];
        recipes?: Record<ResourceLocation, boolean>;
        advancements?: Record<ResourceLocation, boolean | Record<string, boolean>>;
        looking_at?: EntityPredicate;
    } | {
        type: 'slime';
        size?: NumericRange;
    } | {
        type: 'cat' | 'frog' | 'villager' | 'painting';
        variant: ResourceLocation;
    } | {
        type: 'axolotl'  | 'boat' | 'fox' | 'mooshroom' | 'rabbit' | 'horse' | 'llama'  | 'parrot' | 'tropical_fish';
        variant: string;
    } | null;
    vehicle?: EntityPredicate;
    passenger?: EntityPredicate;
    targeted_entity?: EntityPredicate;
    team?: string;
} | null;

export type HeraclesQuestIcon = {
    type: 'heracles:item';
    item: ResourceLocation;
};

export type HeraclesQuestElement = {
    title?: string;
    icon?: HeraclesQuestIcon
}

export type HeraclesQuestTask = HeraclesQuestElement & ({
    type: 'heracles:advancement';
    advancements: ResourceLocation[];
} | {
    type: 'heracles:biome';
    biomes: RegistryValue;
} | {
    type: 'heracles:block_interaction';
    block: RegistryValue;
    state?: StateProperties;

    nbt?: JsonObject;
} | {
    type: 'heracles:changed_dimension';
    from?: ResourceLocation;
    to?: ResourceLocation;
} | {
    type: 'heracles:check';
} | {
    type: 'heracles:composite';
    amount: number;
    tasks: Record<string, HeraclesQuestTask>;
} | {
    type: 'heracles:dummy';
    value: string;
    icon: HeraclesQuestIcon;
    title: string;
    description: string;
} | {
    type: 'heracles:entity_interaction';
    entity: RegistryValue;
    nbt?: JsonObject;
} | {
    type: 'heracles:item';
    item: RegistryValue;
    nbt?: JsonObject;
    amount?: number;
    collection?: 'AUTOMATIC' | 'MANUAL' | 'CONSUME';
} | {
    type: 'heracles:item_interaction';
    item: RegistryValue;
    nbt?: JsonObject;
} | {
    type: 'heracles:item_use';
    item: RegistryValue;
    nbt?: JsonObject;
} | {
    type: 'heracles:kill_entity';
    entity: {
        type: ResourceLocation;
        location?: LocationPredicate;
        effects?: EffectsPredicate;
        nbt?: string | null;
        flags?: EntityFlags;
        target?: EntityPredicate;
    };
    amount?: number;
} | {
    type: 'heracles:location';
    description: string;
    predicate: LocationPredicate;
} | {
    type: 'heracles:recipe';
    recipes: ResourceLocation[];
} | {
    type: 'heracles:stat';
    stat: ResourceLocation;
    target: number;
} | {
    type: 'heracles:structure';
    structures: RegistryValue;
} | {
    type: 'heracles:xp';
    amount?: number;
    xpType?: 'level' | 'points';
});

export type HeraclesQuestReward = HeraclesQuestElement & ({
    type: 'heracles:command';
    command: string;
} | {
    type: 'heracles:item';
    item: ResourceLocation | {
        id: ResourceLocation;
        count?: number;
        nbt?: JsonObject;
    };
} | {
    type: 'heracles:loottable';
    loot_table: ResourceLocation;
} | {
    type: 'heracles:selectable';
    amount?: number;
    rewards: Record<string, HeraclesQuestReward>;
} | {
    type: 'heracles:xp';
    xptype?: 'level' | 'points';
    amount?: number;
});

export type HeraclesQuest = {
    display?: {
        icon?: HeraclesQuestIcon;

        icon_background?: 'heracles:textures/gui/quest_backgrounds/default.png' | 'heracles:textures/gui/quest_backgrounds/circles.png';
        title?: Component;
        subtitle?: Component;
        description?: string[];

        groups?: Partial<Record<string, {
            position: [x: number, y: number];
        }>>;
    };

    settings?: {
        individual_progress?: boolean;
        hidden?: "COMPLETED" | "IN_PROGRESS" | "LOCKED";
    };

    dependencies?: string[];

    tasks?: Record<string, HeraclesQuestTask>;

    rewards?: Record<string, HeraclesQuestReward>;
};
