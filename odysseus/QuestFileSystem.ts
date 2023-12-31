export type QuestInputFileSystem = {
    /**
     * Returns an array of tuples including file names and contents, assumes every file is UTF-8
     * @param name The name of the directory in this file system
     */
    readDirectory(name: string): Promise<[data: string, name: string][]>;

    /**
     * Returns the specified file's content, assumes file is UTF-8
     * @param name The name of the file in this file system
     */
    readFile(name: string): Promise<string>;
};

export type QuestOutputFileSystem = {
    /**
     * Write a file in the root of this file system.
     * @param path The file path
     * @param data The file content
     */
    writeFile(path: string, data: string): Promise<void>;
};
