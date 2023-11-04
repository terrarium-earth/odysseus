import { Json } from "./Json";

type NbtData =
    | {
          block: string;
      }
    | {
          entity: string;
      }
    | {
          storage: string;
      };

type ComponentObject =
    | string
    | (
          | {
                text: string;
            }
          | {
                translate: string;
                fallback?: string;
                with?: (Component | Json)[];
            }
          | {
                score: string;
                objective: string;
            }
          | {
                selector: string;
                separator?: Component;
            }
          | {
                keybind: string;
            }
          | (({
                nbt: string;
                separator?: Component;
                interpret?: boolean;
            } & NbtData) & {
                extra?: Component[];
                style: {
                    bold?: boolean;
                    italic?: boolean;
                    underlined?: boolean;
                    strikethrough?: boolean;
                    obfuscated?: boolean;

                    color?:
                        | `#${string}`
                        | "black"
                        | "dark_blue"
                        | "dark_green"
                        | "dark_aqua"
                        | "dark_red"
                        | "dark_purple"
                        | "gold"
                        | "gray"
                        | "dark_gray"
                        | "blue"
                        | "green"
                        | "aqua"
                        | "red"
                        | "light_purple"
                        | "yellow"
                        | "white";

                    insertion?: string;

                    clickEvent?: {
                        action?:
                            | "open_url"
                            | "open_file"
                            | "run_command"
                            | "suggest_command"
                            | "change_page"
                            | "copy_to_clipboard";
                        value?: string;
                    };

                    hoverEvent?:
                        | { action?: null }
                        | {
                              action: "show_text";
                              contents: Component;
                          }
                        | {
                              action: "show_item";
                              contents:
                                  | string
                                  | {
                                        id: string;
                                        count?: number;
                                        tag?: string;
                                    };
                          }
                        | {
                              action: "show_entity";
                              contents?: {
                                  type: string;
                                  id: string;
                                  name: Component;
                              };
                          };

                    font: string;
                } | null;
            })
      );

export type Component = ComponentObject | ComponentObject[];
