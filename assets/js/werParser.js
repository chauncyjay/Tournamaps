/*This file will serve as an individual parser for .wer files.
Goals:  Import .wer file
        Event info data structure ([name, type, team])
        Player info data structure ([dci, first, last])
        Team info data Structure ([teamName, player1, player2])
        Match info data Structure ([p1, points1, p2, points2])
        
        
*/
function Event(xml, ename, etype, playerlist, tm, rounds, fin){
    this.src = xml;
    this.eventName = ename;
    this.eventType = etype;
    this.players = playerlist;
    this.teams = tm;
    this.matches = rounds;
    this.finished = fin;
}
function Player(dciNo, fname, lname){
    this.dci = dciNo;
    this.firstName = fname;
    this.lastName = lname;
}
function Team(num, tname, p1, p2){
    this.teamID = num;
    this.teamName = tname;
    this.primaryHead = p1;
    this.secondaryHead = p2;
}
function Match(rd, p1, p1p, p2, p2p){
    this.round = rd;
    this.playerOne = p1;
    this.playerOnePoints = p1p;
    this.playerTwo = p2;
    this.playerTwoPoints = p2p;
}
function eventString(e){
    return "Name: " +e.eventName+ " Type: " +e.eventType;
}
//accepts wer file path, returns event object
function createEventWithWERfile(xmlsrc){
    var doc;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            doc = xhttp.responseText;
        }
    };
    xhttp.open("GET", xmlsrc, false);
    xhttp.send();
    
    parser = new DOMParser();
    werDoc = parser.parseFromString(doc, "text/xml");
    
    var name = werDoc.getElementsByTagName('event')[0].getAttribute('title');
    var type = werDoc.getElementsByTagName('event')[0].getAttribute('format');
    var team = werDoc.getElementsByTagName('round')[0].getAttribute('teamformat');
    var play = parsePlayers(werDoc)
    return new Event(werDoc, name, type, play, team, parseMatches(play, werDoc), false);
}
//gets player info from extracted wer doc
function parsePlayers(wer){
    var playerInfo = [];
    var players = wer.getElementsByTagName('person');
    for (var i = 0; i < players.length; i++) {
        var tempdci = players[i].getAttribute('id');
        var tempfname = players[i].getAttribute('first');
        var templname = players[i].getAttribute('last');
        playerInfo.push(new Player(tempdci, tempfname, templname));
    }
    //console.log(playerInfo);
    return playerInfo;
}
//only gets r1 matches for now
function parseMatches(players, wer){
    var matchInfo = [];
    var matches = wer.getElementsByTagName('match');
    for (var i = 0; i < matches.length; i++){
        var pl1 = getPlayerByDCI(players, matches[i].getAttribute('person'));
        var pl1p = getPoints(pl1, matches[i]);
        var pl2 = getPlayerByDCI(players, matches[i].getAttribute('opponent'));
        var pl2p = getPoints(pl2, matches[i]);
        var rnd = parseInt(matches[i].parentNode.getAttribute('number'));
        matchInfo.push(new Match(rnd, pl1, pl1p, pl2, pl2p));
    }
    //console.log(matchInfo);
    return matchInfo;
}
function getPoints(player, match){
    if (match.getAttribute('outcome') === "2"){
        return null;
    }
    else if(player.dci === match.getAttribute('person') && match.getAttribute('outcome') === "1"){
        return parseInt(match.getAttribute('win'));
    }
    else if(player.dci === match.getAttribute('opponent') && match.getAttribute('outcome') === "1"){
        return parseInt(match.getAttribute('loss'));
    }
    else{
        return -1;
    }
}
//accepts array of players and dci number, returns player object
function getPlayerByDCI(array, dciNo) {
    for(var i = 0; i < array.length; i++) {
        if(array[i].dci === dciNo)
            return array[i]
    }
    return "Player not found";
}
function getPlayerFullName(player){
    return player.firstName +" "+player.lastName;
}