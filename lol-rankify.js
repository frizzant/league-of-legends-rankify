registerPlugin({
    name: 'League Of Legends Rankify',
    version: '1.1.2',
    backends: ['ts3'],
    description: 'Adds the corresponding League Of Legends Rank & Level for each user',
    author: 'Erin McGowan <sinusbot_lolrankify@protected.calmarsolutions.ch>',
    requiredModules: ['http', 'net', 'db', 'fs'],
    vars: [
        {
            name: 'LeagueOfLegendsApiKey',
            title: 'Official RIOT API Key needed',
            type: 'string',
            placeholder: 'Looks like this: RGAPI-3ffb7016-687d-414a-aff4-0d5f18069a78'
        },
        {
            name: 'LeagueRegion',
            title: 'Select Riot Games Region',
            type: 'select',
            options: ['br1', 'eun1', 'euw1', 'jp1', 'kr', 'la1', 'la2', 'na1', 'oc1', 'tr1', 'ru']
        },
        {
            name: 'summonerLevelGroupIDs',
            title: 'Add Summoner Level groups for lvl "0-30, 30+, 50+, 75+, 100+, 150+, 200+, 250+, 500+" in this order. (USE ENTER KEY)',
            type: 'strings',
        },
        {
            name: 'summonerLaneGroupIDs',
            title: 'Add Summoner Lane groups for "TOP_LANE, MID_LANE, BOT_LANE, JUNGLE, SUPPORT" in this order. (USE ENTER KEY)',
            type: 'strings',
        },
        {
            name: 'PermUserSetDescr',
            title: 'Allow users to set their own description with !lolsetname <string>',
            type: 'select',
            options: ['no', 'yes'],
            placeholder: 'Default = no'
        },
        { //-- Ranks
            name: 'GroupIron',
            title: 'Input Group For Iron (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupBronze',
            title: 'Input Group For Bronze (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupSilver',
            title: 'Input Group For Silver (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupGold',
            title: 'Input Group For Gold (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupPlatinum',
            title: 'Input Group For Platinum (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupDiamond',
            title: 'Input Group For Diamond (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupMaster',
            title: 'Input Group For Master (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupGrandmaster',
            title: 'Input Group For Grandmaster (Group ID)',
            type: 'number'
        },
        {
            name: 'GroupChallenger',
            title: 'Input Group For Challenger (Group ID)',
            type: 'number'
        }, //-- END Ranks
        {
            name: 'messageUnranked',
            title: 'Input your message incase the client is unranked',
            type: 'string',
            placeholder: 'Sorry. You are unranked.',
        },
        {
            name: 'messageRankReload',
            title: 'Input your message for when the client reloads the rank manually',
            type: 'string',
            placeholder: 'Your rank was reloaded.',
        },
    ],
}, function(sinusbot, config, meta) {
    // Variables
    const engine = require('engine')
    const backend = require('backend')
    const event = require('event')
    const http = require('http')

    const apiKey = config.LeagueOfLegendsApiKey
    const protocol = 'https://'
    const leagueRankGroupIDs = [config.GroupIron, config.GroupBronze, config.GroupSilver, config.GroupGold, config.GroupPlatinum, config.GroupDiamond, config.GroupMaster, config.GroupGrandmaster, config.GroupChallenger]
    const officialRankNamesArray = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']
    const officialLaneNamesArray = ['TOP', 'MID', 'BOTTOM', 'JUNGLE', 'SUPPORT', 'NONE']
    const permUserSetDescr = config.PermUserSetDescr || 'no'
    const summonerLevelGroupIDsArray = config.summonerLevelGroupIDs
    const summonerLaneGroupIDsArray = config.summonerLaneGroupIDs
    //--
    // Derived Variables
    function clientBackend() {}
    let clients // setting them in mainEvent now
    let leagueRegionShort = ['br1', 'eun1', 'euw1', 'jp1', 'kr', 'la1', 'la2', 'na1', 'oc1', 'tr1', 'ru']
    let apiUrlSummonerV4Name
    let apiUrlLeagueV4Summoner
    let requestArray = []
    //--
    // Objects
    //--
    // Var Messages
    let message = {
        rankReload: config.messageRankReload,
        unranked: config.messageUnranked,
        newDescription: config.messageNewDescription,
    }
    if (!message.rankReload) { message.rankReload = 'Your rank was reloaded.' }
    if (!message.unranked) { message.unranked = 'Sorry. You are unranked.' }
    if (!message.newDescription) { message.newDescription = 'Your description is now: ' }
    //--
    event.on('clientVisible', function (ev) {
        backendClientsReload()
        mainEvent(client = ev.client)
    })

    event.on('chat', function(ev) {
        backendClientsReload()

        if (ev.text == '!lolreload') {
            console.log('Reloaded Rank of: ' + ev.client.name() )
            mainEvent(client = ev.client)
            ev.client.chat(message.rankReload)
        }
        if (ev.text == '!lolreload all') {
            ev.client.chat('...reloading')

            let chain = Promise.resolve()
            for (let client in clients) {
                chain = chain.then(resolve => mainEvent(clients[client]));
                ev.client.chat('--> Reloaded rank of ' + clients[client].name() + '.')
            }

            ev.client.chat('ALL ranks reloaded.')
        }
        if (ev.text.startsWith('!lolsetname') && permUserSetDescr === '1') { // user can set description by himself
            let newDescription = ev.text.replace(/!lolsetname /, '')
            ev.client.setDescription(newDescription)
            ev.client.chat(message.newDescription + newDescription)

            mainEvent(client = ev.client)
            ev.client.chat(message.rankReload)
        }
        if (ev.text == '!lollfg') {

        }
    })

    function backendClientsReload() {
        clients = backend.getClients() // get list of all current clients
    }

    function mainEvent(client, event) {
        return new Promise(function (resolve, reject) {
            requestArray = []
            if (client.description().length > 2) {

                let userName = client.description(); // Description where username is defined
                apiUrlSummonerV4Name = protocol + leagueRegionShort[config.LeagueRegion] + '.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + userName.replace(/ /g, '%20') + '?api_key=' + apiKey;

                if (client.getServerGroups().length > 0) {

                    makeRequest(apiUrlSummonerV4Name)
                        .then(result => makeRequest(protocol + leagueRegionShort[config.LeagueRegion] + '.api.riotgames.com/lol/league/v4/entries/by-summoner/' + result.id + '?api_key=' + apiKey))
                        .catch(error => engine.log('Error: ' + error))
                        .then(result => compareLocalGroups(result[0], client.getServerGroups(), leagueRankGroupIDs, officialRankNamesArray, result[0].tier, client))
                        .catch(error => engine.log('Error: ' + error))
                        .then(result => makeRequest(protocol + leagueRegionShort[config.LeagueRegion] + '.api.riotgames.com/lol/match/v4/matchlists/by-account/' + requestArray[0].accountId + '?api_key=' + apiKey + '&endIndex=40', client))
                        .catch(error => engine.log('Error: ' + error))
                        .then(result => checkLaneStats(result, client))
                        .catch(error => engine.log('Error: ' + error))
                        .then(result => checkSummonerLevel(summonerLevelGroupIDsArray, requestArray[0].summonerLevel, client, result))
                        .catch(error => engine.log('Error: ' + error))
                        .then(result => resolve(result))
                        .catch(error => engine.log('Error: ' + error));

                }

            } else {
                resolve(client.name() + ' has no valid description.')
            }
        })
    }

    function compareServerGroups(serverGroupList, groupIDsArray, currentGroup, client) {
        for (let clientGroup of serverGroupList) { // client groups
            for (let group of groupIDsArray) {
                if (group === clientGroup.id()) { // array of groups
                    if (group !== currentGroup) // if not equal to group that should be added
                        removeServerGroupRanked(group, client)
                }
            }
        }
    }

    function checkLaneStats(parsed, client) {
        return new Promise(function (resolve, reject) {
            if (summonerLaneGroupIDsArray.length > 4) {
                let map = new Map()
                map.set('TOP', 0)
                map.set('MID', 0)
                map.set('BOTTOM', 0)
                map.set('JUNGLE', 0)
                map.set('NONE', 0)

                let map_role = new Map()
                map_role.set('SOLO', 0)
                map_role.set('DUO', 0)
                map_role.set('NONE', 0)
                map_role.set('DUO_CARRY', 0)
                map_role.set('DUO_SUPPORT', 0)

                for (let item of parsed.matches) {
                    let number = map.get(item.lane)
                    map.set(item.lane, number + 1)

                    number = map_role.get(item.role)
                    map_role.set(item.role, number + 1)
                }

                let mostUsedLane = [...map.entries()].reduce((a, e) => e[1] > a[1] ? e : a) // get the map with the highest value
                let mostUsedLaneName = mostUsedLane[0]

                let mostUsedRole = [...map_role.entries()].reduce((a, e) => e[1] > a[1] ? e : a) // get the map with the highest value
                let mostUsedRoleName = mostUsedRole[0]

                if (mostUsedLaneName === 'BOTTOM') {
                    if (mostUsedRoleName === 'DUO_SUPPORT') {
                        mostUsedLaneName = 'SUPPORT'
                    }
                }

                if (mostUsedLaneName === 'NONE') { // role is unclear
                    client.chat('Lane Preference Unclear.')
                    resolve(parsed)
                    return
                }

                compareLocalGroups(parsed, client.getServerGroups(), summonerLaneGroupIDsArray, officialLaneNamesArray, mostUsedLaneName, client)
                resolve(parsed)
            } else {
                resolve(parsed)
            }
        })
    }

    function checkSummonerLevel(groupIDsArray, level, client, request) {
        return new Promise(function (resolve, reject) {
            if (summonerLevelGroupIDsArray) {

                if (groupIDsArray !== undefined) {
                    function execute(number) {
                        compareServerGroups(client.getServerGroups(), groupIDsArray, groupIDsArray[number], client)
                        addServerGroupRanked(groupIDsArray[number], client)
                    }

                    if (level < 30) { //-25
                        execute(0)
                    } else if (level < 50) { //25
                        execute(1)
                    } else if (level < 75) { //50
                        execute(2)
                    } else if (level < 100) { //75
                        execute(3)
                    } else if (level < 150) { //100
                        execute(4)
                    } else if (level < 200) { //150
                        execute(5)
                    } else if (level < 250) { //200
                        execute(6)
                    } else if (level < 500) { //250
                        execute(7)
                    } else if (level > 500) { //500+
                        execute(8)
                    } else {
                        reject('An Unknown Error Occurred. var level is not a number.')
                    }

                    resolve(request) // continue to forward the request
                } else {
                    reject('Can\'t work with Array. Array empty.')
                }
            } else {
                resolve(request)
            }
        })
    }

    function compareLocalGroups(parsed, currentGroups, groupArrayIDs, groupNamesArray, newGroupName, client) {
        return new Promise(function (resolve, reject) {
            let count = 0
            let countMax = currentGroups.length * groupArrayIDs.length
            let compareSwitch = false

            for (let currentGroup of currentGroups) {
                for (let groupID of groupArrayIDs) { // check if one of the Rank Groups match the added groups
                    if (currentGroup.id() == groupID) {
                        count++
                        compareSwitch = true
                        compareGroup(parsed, currentGroup.id(), groupArrayIDs, groupNamesArray, newGroupName, client)
                        resolve(parsed)
                    } else {
                        count++
                        if (count === countMax && compareSwitch === false) {
                            compareGroup(parsed, undefined, groupArrayIDs, groupNamesArray, newGroupName, client)
                            resolve(parsed)
                        }
                    }
                }
            }
        })
    }

    function compareGroup(parsed, currentGroup, theNewGroupIdArray, theNewGroupNameArray, newGroupName, client) { // beware that currentGroup will be removed!
        return new Promise(function (resolve, reject) {
            if (parsed) {
                let newGroup = theNewGroupNameArray.indexOf(newGroupName) // get the index by string
                newGroup = theNewGroupIdArray[newGroup] // insert index to get correct group

                if (currentGroup == newGroup) {
                    resolve()
                } else if (currentGroup != newGroup) {
                    if (currentGroup !== undefined) {
                        removeServerGroupRanked(currentGroup, client)
                    }
                    addServerGroupRanked(newGroup, client)
                    resolve()
                }
            } else {
                client.chat(message.unranked)
            }
        })
    }

    function addServerGroupRanked(group, client) {
        return new Promise(function (resolve, reject) {
            for (let groupId of client.getServerGroups()) {
                if (groupId.id() === group) {
                    resolve('Group exists. None added to: ' + client.name())
                    return
                }
            }
            client.addToServerGroup(group)
            resolve('Rank added for ' + client.name())
        })
    }

    function removeServerGroupRanked(group, client) {
        return new Promise(function (resolve, reject) {
            client.removeFromServerGroup(group)
            resolve()
        })
    }

    function makeRequest(url, method, datatype, timeout) {
        return new Promise(function (resolve, reject) {

            http.simpleRequest({
                'method': method || 'GET',
                'url': url,
                'dataType': datatype || 'json',
                'timeout': timeout || 6000,
            }, function (error, response) {

                if (error) {
                    reject(error)
                }

                if (response.statusCode == 404) {
                    reject(response.status)
                }

                if (response.statusCode != 200) {
                    reject(response.status)
                }

                let parsed = JSON.parse(response.data)
                requestArray.push(parsed)
                resolve(parsed);

            });

        })
    }

});