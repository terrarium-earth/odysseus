type JsonPrimitive = string | number | boolean | null;

export type JsonObject = {
    [name: string]: Json;
};

export type Json = JsonPrimitive | JsonObject | Json[];
