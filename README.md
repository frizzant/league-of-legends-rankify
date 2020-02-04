# league-of-legends-rankify
### for the TS3 Sinusbot

![rankify](img/lolrankify_logo_preview.png "LoL Rankify Preview Logo")

This script connects your Sinusbot with the League Of Legends API,
to get the rank of your users. Simply add the LOL username as the client/user
description in Teamspeak.

### Installation

Simply copy the script `lol-rankify.js` to your Sinusbot `scripts/` folder.
Or install it via NPM install.

### NPM Install

`npm i league-of-legends-rankify`

---

### Usage

0) Ger your Riot API Key: https://developer.riotgames.com/ --> Register Product --> Personal API Key.
0) Install/upload the script
0) Fill out/Select options in the backend (API Key etc.) & make your server groups with the LOL icons ready
0) Activate the lol-rankify script
0) Fill in the Summoner Name as the description of the client. Yes names with spaces inside work.
0) !lolreload (client must do this himself), !lolreload all, or wait until the client reconnects to the server.
0) Let it do its magic.

---

### Hints

0) It will not work without a verified RIOT API key. If you request it, chances are very high that you will get it.
0) If you **NEED** your client descriptions for something crucial, and don't want to replace them
with the clients summoner names, this script does not yet offer DB saved summoner names.

---

### Commands

Write the command to the Bot with the active script.

!lolreload
> reloads the rank of the client who executes the command

!lolreload all
> reloads the rank of all clients. BEWARE that this script has no reate limiting included.

#### Optional Commands

!lolsetname \<SummonerName>
> sets the name for the user in his description. This is needed for clients to rename
>their own description, if the servergroups do not allow this. It is toggled to
><code>false</code> in the SB backend by default.

---

### Minimal Ressources
The group gets added on `event` `clientVisible`. This means, in most cases it will
update only when a user connects/reconnects, not on every channel switch.
This means less script executions, in favor of your server performance.

###### "I chose this method purposely over `event` `clientMove`."

---

## Credits

**DrWarpMan** from the SinusBot Forums -> drwarpman@gmail.com
https://forum.sinusbot.com/members/drwarpman.12874/

>DrWarpMan assisted me through parts of getting to know the SinusBot API and
has developed a more sophisticated version of this script, with a multitude
of options, which is available in exchange for a donation. He has the capability
to make any of your scripting needs reality.
Hit him up at the above mentioned email, or via the Sinusbot Forums.