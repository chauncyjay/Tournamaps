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
        var event = createEventWithWERfile(WER_URL);
        //sets heading to name of bracket
        $('#bracketheader').text(event.eventName +" Bracket");

        //creates bracket data structure
        var bracketData = {
            teams:
                getBracket(event),
            results: 
                getResults(event)
        };
        
        displayBracket(bracketData);
    }
    if ($(location).attr('pathname') === COMMAND_URL){
        buildCommandNodes();
    }
});

//builds the command nodes for command page
function buildCommandNodes(){
    for(var i=0; i < 4; i++){
        $.get('assets/html/cmdnode.html', function(data) {
            $(data).filter('.cmdnode').appendTo('.nodeContainer');
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
    
    $.ajax({
        type: "POST",
        dataType : 'json',
        async: false,
        url: userData,
        data: {data: data},
        success: function () {alert("Thanks!"); },
        failure: function() {alert("Error!");}
    });
    
}
//gets bracket data and builds bracket
function displayBracket(saveData) {
    //actually builds the bracket with saving enabled
    $(function() {
        var container = $('div#singlebracket');
        container.bracket({
            teamWidth: 150,
            scoreWidth: 20,
            matchMargin: 50,
            roundMargin: 200,
            
            disableToolbar: true,
            disableTeamEdit: true,
            
            init: saveData,
            save: saveFn,
            userData: BRACKET_SAVE_FILE
        });
        
        /* You can also inquiry the current data */
        var data = container.bracket('data');
        console.log(data);
        console.log(jQuery.toJSON(data));
    })
}
//builds list of brackets on existing table
function buildBracketList() {
    var bracket
    $("#jsGrid").jsGrid({
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
function validateLocation(loc){
    
}
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

//gets the Player IDs and returns appropriate data structure
// [["Player 1", "Player 8"],   match 1
//  ["Player 4", "Player 5"],   match 2
//  ["Player 3", "Player 6"],   match 3
//  ["Player 2", "Player 7"]];  match 4
function getBracket(event){
    var playersFormatted = [];
    for (var i = 0; i < 4; i++){
        playersFormatted.push([getPlayerFullName(event.matches[i].playerOne), getPlayerFullName(event.matches[i].playerTwo)]);
    }
    //console.log(playersFormatted);
    return playersFormatted;
}

//gets results andn returns appropriate data structure
//[[[[a, b], [c, d], [e, f], [g, h]],   round 1
//  [[i, j], [k, l]],                   round 2
//  [[m, n], [o, p]]]]                  finals/loser
function getResults(bracket){
    var resultsFormatted = [[]];
    //round 1
    for (var i = 0; i < 4; i++){
        resultsFormatted[0].push([bracket.matches[i].playerOnePoints, bracket.matches[i].playerTwoPoints]);
        //console.log(resultsFormatted[0][i])
    }
    //round 2
    for (var j = 0; j < 2; j++){
        resultsFormatted[0].push([null, null]);
    }
    //finals/loser
    for (var k = 0; k < 2; k++){
        resultsFormatted[0].push([null, null]);
    }
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