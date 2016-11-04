var BRACKET_URL = '/bracket.html',
    MAP_URL = 'map.html',
    STATUS_URL = '',
    PRIZED_URL = '',
    BRACKET_LIST_URL = '/bracketlist.html',
    COMMAND_URL = '/command.html',
    WER_URL = "/assets/werFiles/example.wer",
    BRACKET_SAVE_FILE = "/assets/php/jsonSave.php";

$(document).ready(function () {
    
    if ($(location).attr('pathname') === BRACKET_LIST_URL) {  //only runs on bracket list page
        buildBracketList();
    }
    if ($(location).attr('pathname') === BRACKET_URL) {  //only runs on bracket page
        var bracketContainer = $('div#singlebracket');
        var WERevent = createEventWithWERfile(WER_URL);
        //sets heading to name of bracket
        $('#bracketheader').text(WERevent.eventName +" Bracket");

        //creates bracket data structure
        var bracketData = {
            teams:
                getJQBracketPlayers(WERevent),
            results: 
                getJQBracketResults(WERevent)
        };
        
        updateBracket(bracketContainer, bracketData);
    }
    if ($(location).attr('pathname') === COMMAND_URL){
        buildCommandNodes();
    }
    
});

//builds the command nodes for command page
function buildCommandNodes(){
    for(var i=0; i < 4; i++){
        $.get('assets/html/cmdnode.html', function(data) {
            $(data).filter('div.cmdnode').appendTo('div.nodeContainer');
        });
    }
}
/* Called whenever bracket is modified
*
* data:     changed bracket object in format given to init
* userData: optional data given when bracket is created.
*/
function saveFn(data, userData) {
    var json = jQuery.toJSON(data);
    console.log(json);
    //file output goes here
    /*$.ajax({
        type: "POST",
        dataType : 'json',
        async: false,
        url: userData,
        data: {data: data},
        success: function () {alert("Thanks!"); },
        failure: function() {alert("Error!");}
    });*/
    
}
//gets bracket data and builds bracket
function updateBracket(cont, data) {
    
    //brackets data onto container
    cont.bracket(getJQBracketData(data));
    
    //populates buttons onto container
    populateBracketButtons(cont);
}
//accepts init for bracket and returns data structure for bracket
function getJQBracketData(d){
    return {
        teamWidth: 150,
        scoreWidth: 20,
        matchMargin: 50,
        roundMargin: 150,

        disableToolbar: true,
        disableTeamEdit: true,

        init: d,
        save: saveFn,
        userData: BRACKET_SAVE_FILE
    };
}
//builds list of brackets on existing table
function buildBracketList() {
    var bracket
    $("div#jsGrid").jsGrid({
        width: "80%",
        height: "430px",
 
        sorting: true,
 
        data: getBracketListData(),
        
        rowClick: function(args){
        },
        fields: [
            { name: "Event Name", type: "text" },
            { name: "Location", type: "text", width: 50, css: "mapLoc", headercss: "locHead"},
            { name: "Complete", type: "text" },
            { name: "Prized", type: "text" }
        ]
    });
    
    //builds each row by getting information for the table
    /*for (i = 1; i < 4; i += 1) {

        //create string and add tags and name
        var tableString = '<tr><td><div onclick="location.href=\'' + BRACKET_URL + '\'\">' + getEvent(i) + '</div></td>';

        //add more tags and location
        tableString += '<td><div onclick=\"location.href=\'' + MAP_URL + '\'\">' + getLocation(i) + '</div></td>';

        //add more tags and status
        tableString += '<td><div onclick=\"location.href=\'' + STATUS_URL + '\'\">' + getStatus(i) + '</div></td>';
        
        //add more tags and prizing
        tableString += '<td><div onclick=\"location.href=\'' + PRIZED_URL + '\'\">' + getPrized(i) + '</div></td></tr>';

        //console.log(tableString);
        //adds string after last element in tbody
        $('#brackets').find('tbody:last').append(tableString);
    }*/
}

function getCurrentResult(round, match, player) {
    var container = $('div#singlebracket');
    return container.bracket('data').results[0][round-1][match-1][player-1];
}
//updates winner by doing things
function updateWinner(round, match, player){
    console.log("Round: " +round+ " Match: " +match+ " Player: " +player);
    var container = $('div#singlebracket');
    var newResults = container.bracket('data').results;
    var currentResult = getCurrentResult(round, match, player);
    console.log(newResults);
    if(currentResult === 1)
        newResults[0][round-1][match-1] = [null, null]
    else if (player === 1)
        newResults[0][round-1][match-1] = [1, 0]
    else if (player === 2)
        newResults[0][round-1][match-1] = [0, 1]
    else
        console.log("Invalid player number, score not updated.")
    console.log(newResults);
        
    updateBracket(container, {teams:container.bracket('data').teams, results:newResults});
}
function formatCurrentResults(array){
    var resultsFormatted = [[]];
    for (var i = 0; i < array.length; i++){
        
    }
}
//returns array list of brackets for JSGrid
function getBracketListData(){
    var bracket = [];
    for(var i = 1; i < 40; i++){
        bracket.push({"Event Name": getEvent(i),
                      "Location": getLocation(i),
                      "Complete": getStatus(i),
                      "Prized": getPrized(i)});
    }
    return bracket;
}

//gets player names from event object and returns bracketable array
// [["Player 1", "Player 8"],   match 1
//  ["Player 4", "Player 5"],   match 2
//  ["Player 3", "Player 6"],   match 3
//  ["Player 2", "Player 7"]];  match 4
function getJQBracketPlayers(e){
    var playersFormatted = [];
    for (var i = 0; i < 4; i++){
        playersFormatted.push([getPlayerFullName(e.matches[i].playerOne), getPlayerFullName(e.matches[i].playerTwo)]);
    }
    //console.log(playersFormatted);
    return playersFormatted;
}

//gets results from event object and returns bracketable array
//[[[[a, b], [c, d], [e, f], [g, h]],   round 1
//  [[i, j], [k, l]],                   round 2
//  [[m, n], [o, p]]]]                  finals/loser
function getJQBracketResults(e){
    var resultsFormatted = [[]];
    
    var round1 = [];
    for (var i = 0; i < 4; i++){
        round1.push([e.matches[i].playerOnePoints, e.matches[i].playerTwoPoints]);
    }
    resultsFormatted[0].push(round1);
    
    var round2 = [];
    for (var j = 0; j < 2; j++){
        round2.push([e.matches[j+4].playerOnePoints, e.matches[j+4].playerTwoPoints]);
    }
    resultsFormatted[0].push(round2);
    
    var finals = []
    finals.push([e.matches[6].playerOnePoints, e.matches[6].playerTwoPoints]);
    finals.push([null, null]);

    resultsFormatted[0].push(finals);
    
    return resultsFormatted;
}

//gets event name
function getEvent(num) {
    return 'Event ' + num;
}
//gets event location
function getLocation(num) {
    return 'A' + num;
}
//gets event completion status
function getStatus(num) {
    if (num % 2 === 0) {
        return 'Incomplete';
    } else {
        return 'Complete';
    }
}
//gets event prizing status
function getPrized(num) {
    if (num % 3 === 0) {
        return 'Incomplete';
    } else {
        return 'Complete';
    }
}

function populateBracketButtons(cont) {
    // createRoundButtons(1,4,cont);
    // createRoundButtons(2,2,cont);
    // createRoundButtons(3,1,cont);
}

function createRoundButtons(round,matches,cont) {
    for(var match=1;match<=matches;match++) {
        for(var player=1;player<=2;player++) {
            var onclickFunction = 'updateWinner('+round+','+match+','+player+')';
            var text = 'P'+player+' Win';
            var buttonName = "r"+round+" m"+match;
            if(round === 3) {
                buttonName = 'fin';
            }
            buttonName+=" p"+player;
            $('<button/>')
                .addClass(buttonName)
                .attr('onclick', onclickFunction)
                .text(text)
                .appendTo(cont);
        }
    }
}