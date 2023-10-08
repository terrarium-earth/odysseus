export type Long = bigint;

export type JsonPrimitive = string | number | Long | boolean | null;

export type JsonObject = {
    [name: string]: Json;
};

export type Json = JsonPrimitive | JsonObject | Json[];
