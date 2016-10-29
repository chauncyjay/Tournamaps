var BRACKET_URL = '/bracket.html',
    MAP_URL = 'map.html',
    STATUS_URL = '',
    PRIZED_URL = '',
    BRACKET_LIST_URL = '/bracketlist.html',
    COMMAND_URL = '/command.html'
    WER_URL = "/assets/werFiles/example.wer";

$(document).ready(function () {
    
    //Use this to make tables added dynamically sortable
    //Documentation: http://www.kryogenix.org/code/browser/sorttable/
    //sorttable.makeSortable(newTableObject);
    
    if ($(location).attr('pathname') === BRACKET_LIST_URL) {  //only runs on bracket list page
        buildBracketList();
    }
    if ($(location).attr('pathname') === BRACKET_URL) {  //only runs on bracket page
        var event = createEventWithWERfile(WER_URL);
        //console.log(eventString(singleBracket));
        displayBracket(event);
    }
    if ($(location).attr('pathname') === COMMAND_URL){
        buildCommandNodes();
    }
});

//builds the command nodes for command page
function buildCommandNodes(){
    
}

//gets bracket data and builds bracket
function displayBracket(e) {
    //sets heading to name of bracket
    $('#bracketheader').text(e.eventName +" Bracket");
    
    //creates bracket data structure
    var saveData = {
        teams:
            getBracket(e),
        results: 
            getResults(e)
    };
    
    //actually builds the bracket with saving enabled
    $(function() {
        var container = $('div#singlebracket');
        container.bracket({
            init: saveData,
            save: saveFn,
            userData: "http://myapi"
        });

        /* You can also inquiry the current data */
        var data = container.bracket('data');
        $('#dataOutput').text(jQuery.toJSON(data));
    })
}

//builds list of brackets on existing table
function buildBracketList() {
    //builds each row by getting information for the table
    for (i = 1; i < 4; i += 1) {

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
    }
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
/* Called whenever bracket is modified
*
* data:     changed bracket object in format given to init
* userData: optional data given when bracket is created.
*/
function saveFn(data, userData) {
    var json = jQuery.toJSON(data)
    $('#saveOutput').text('POST '+userData+' '+json)
    /* You probably want to do something like this
    jQuery.ajax("rest/"+userData, {contentType: 'application/json',
                                  dataType: 'json',
                                  type: 'post',
                                  data: json})
    */
}