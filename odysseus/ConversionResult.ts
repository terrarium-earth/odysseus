import {HeraclesQuest} from "./HeraclesQuest";

export type ConversionResult = {
    quests: Record<string, HeraclesQuest>;
    groups: string[];
};
