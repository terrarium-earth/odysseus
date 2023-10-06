# Odysseus
A Project Odyssey tool for converting FTB and HQM quest-packs to the [Heracles](https://github.com/terrarium-earth/Heracles) format.

## Usage

Set up with `npm install` and `npm run build --workspaces`.

### Via CLI

 - Place your `quests` folder (the one containing `data.snbt`) in `odysseus-cli/`
 - Run `npm run start --workspace=odysseus-cli -- --input=quests`
 - Copy the `output/quests/` folder to your `config/heracles/` folder. 

### Via Discord Bot

(also available on the [terrarium earth discord](https://discord.terrarium.earth/))

- To run locally: `CLIENT_PUBLIC_KEY={key} DISCORD_TOKEN={token} npm run start --workspace=odysseus-bot`
- Zip your `quests` folder such that `data.snbt` is on the top-level of the archive.
- Run `/convert` and upload the quests zip.
