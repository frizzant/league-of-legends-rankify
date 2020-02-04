# league-of-legends-rankify
### for the TS3 Sinusbot

![rankify](img/lolrankify_logo_preview.png "LoL Rankify Preview Logo")

This script connects your Sinusbot with the League Of Legends API,
to get the rank of your users. Simply add the LOL username as the client/user
description in Teamspeak.

###Minimal Ressources
The group gets added on `event` `clientVisible`. This means, in most cases it will
update only when a user connects/reconnects, not on every channel switch.
This means less script executions, in favor of your server performance.

######"I chose this method purposely over `event` `clientMove`."