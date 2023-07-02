export type QuestInputFileSystem = {
    /**
     * Returns an array of file contents, assumes every file is UTF-8
     * @param name The name of the directory in this file system
     */
    readDirectory(name: string): Promise<string[]>;

    /**
     * Returns the specified file's content, assumes file is UTF-8
     * @param name The name of the file in this file system
     */
    readFile(name: string): Promise<string>;
};

export type QuestOutputFileSystem = {
    /**
     * Write a file in the root of this file system.
     * @param name The file name
     * @param data The file content
     */
    writeFile(name: string, data: string): Promise<void>;
};
