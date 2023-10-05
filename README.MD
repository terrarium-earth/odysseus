# Odysseus
A Project Odyssey tool for converting FTB and HQM quest-packs to the Heracles format.

## Installation
### Prerequisites: Node.js, npm

1. In the main repo directory, do `npm install`.
2. In the odysseus sub-directory, do `npm run build`.
3. Optionally, do `npm run build` in the CLI and bot directories, if those functionalities are wanted.

## Usage
To run the CLI, do `npm run start --workspace=odysseus-cli -- --input=quests`, changing `quests` to the quest directory to convert. All CLI parameters are supported.

To run the bot locally, do `CLIENT_PUBLIC_KEY={key} DISCORD_TOKEN={token} npm run start --workspace=odysseus-bot`
