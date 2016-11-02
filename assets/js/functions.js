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
        
        updateBracket($('div#singlebracket'), event);
        
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
    console.log(json);
    
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
//brackets data from src to container div
function updateBracket(container, src){
    var bracketData = {
            teams:
                initializeTeams(src),
            results: 
                initializeResults(src)
    };
    container.bracket(getBracketData(bracketData))
    populateBracketButtons(container);
}
//returns proper data structure for .bracket() function
function getBracketData(src){
    return {
            teamWidth: 150,
            scoreWidth: 20,
            matchMargin: 50,
            roundMargin: 150,
            
            disableToolbar: true,
            disableTeamEdit: true,
            
            init: src,
            save: saveFn,
            userData: BRACKET_SAVE_FILE
    };
}

function getBracketListData(){
    var bracketList = [];
    for(var i = 1; i < 40; i++){
        bracketList.push({"Event Name": getEvent(i),
                      "Location": getLocation(i),
                      "Complete": getStatus(i),
                      "Prized": getPrized(i)});
    }
    return bracketList;
}

//gets player names from array of matches and returns appropriate data structure
// [["Player 1", "Player 8"],   match 1
//  ["Player 4", "Player 5"],   match 2
//  ["Player 3", "Player 6"],   match 3
//  ["Player 2", "Player 7"]];  match 4
function initializeTeams(psrc){
    var playersFormatted = [];
    for (var i = 0; i < 4; i++){
        playersFormatted.push([getPlayerFullName(psrc.matches[i].playerOne), getPlayerFullName(psrc.matches[i].playerTwo)]);
    }
    return playersFormatted;
}

//gets results from array of matches and returns appropriate data structure
//[[[[a, b], [c, d], [e, f], [g, h]],   round 1
//  [[i, j], [k, l]],                   round 2
//  [[m, n], [o, p]]]]                  finals/loser
function initializeResults(rsrc){
    var resultsFormatted = [[]];
    //round 1
    for (var i = 0; i < 4; i++){
        resultsFormatted[0].push([rsrc.matches[i].playerOnePoints, rsrc.matches[i].playerTwoPoints]);
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
function populateBracketButtons(container){
    //wtf is this callback hopefully it works
    for(var i = 1; i <= 8; i++){
            var j = Math.round(i/2);
            var k = Math.round(i/4);
            var l = (i % 2) + 1;
            $('<button/>')
                .addClass('r1')
                .addClass(function(){
                    return 'm' + j;
                })
                .addClass(function(){
                    if (i % 2 === 0){
                        $('<button/>')
                            .addClass('r2')
                            .addClass(function(){
                                return 'm' + k;
                            })
                            .addClass(function(){
                                if (i % 4 === 0){
                                    $('<button/>')
                                        .addClass('fin')
                                        .addClass(function(){
                                            if (i % 8 === 0){
                                                $(this).text('P1 Win');
                                                return 'p1';
                                            }
                                            else{
                                                $(this).text('P2 Win');
                                                return 'p2';
                                            }
                                        })
                                        .attr('onclick', 'updateScore(3, 1, '+l+', 2)')
                                        .appendTo(container);
                                    $(this).text('P1 Win');
                                    return 'p1';
                                }
                                else{
                                    $(this).text('P2 Win');
                                    return 'p2';
                                }
                            })
                            .attr('onclick', 'updateScore(2, '+k+', '+l+')')
                            .appendTo(container);
                        $(this).text('P1 Win');
                        return 'p1';
                        }
                    else{
                        $(this).text('P2 Win');
                        return 'p2'
                    }
                })
                .attr('onclick', 'updateScore(1, '+j+', '+l+', 2)')
                .appendTo(container);
        }
}