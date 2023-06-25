export type ResourceLocation = `${string}:${string}`;
export type TagKey = `#${ResourceLocation}`
export type RegistryValue = ResourceLocation | TagKey;
