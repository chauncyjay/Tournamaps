var $, console; //STUPID JSLINT STUFF
var BRACKET_URL = 'bracket.html',
    MAP_URL = 'map.html',
    STATUS_URL = '',
    PRIZED_URL = '',
    BRACKET_LIST_HTML = 'bracketlist.html',
    i;

$(document).ready(function () {
    
    //Use this to make tables added dynamically sortable
    //Documentation: http://www.kryogenix.org/code/browser/sorttable/
    //sorttable.makeSortable(newTableObject);
    
    if ($(location).attr('pathname') === '/' + BRACKET_LIST_HTML) {  //only runs on bracket list 
        buildBracketList();
    }
    if ($(location).attr('pathname') === '/' + BRACKET_URL) {  //only runs on bracket list 
        buildBracket();
    }
});
function buildBracket() {
    var saveData = {
        teams:
            getBracket(),
        results: [
            [
                [[0, 0], [0, 0], [0, 0], [0, 0]],
                [[0, 0], [0, 0]],
                [[0, 0], [0, 0]]
            ]
        ]
    };

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
function buildBracketList() {
    //builds each row by getting information for the table
    for (i = 1; i < 4; i += 1) {

        //create string and add tags and name
        var tableString = '<tr><td><div onclick="location.href=\'' + BRACKET_URL + '\'\">' + getEvent(i) + '</div></td>';

        //add more tags and location
        tableString += '<td><div onclick=\"location.href=\'' + MAP_URL + '\'\">' + getLocation(i) + '</div></td>';

        //add more tags and status
        tableString += '<td><div onclick=\"location.href=\'' + STATUS_URL + '\'\">' + getStatus(i) + '</div></td>';

        tableString += '<td><div onclick=\"location.href=\'' + PRIZED_URL + '\'\">' + getPrized(i) + '</div></td></tr>';

        //console.log(tableString);

        $('#brackets').find('tbody:last').append(tableString);
    }
}
function getBracket(){
    return [["Player 1", "Player 8"],
          ["Player 4", "Player 5"],
          ["Player 3", "Player 6"],
          ["Player 2", "Player 7"]];
}
function getEvent(num) {
    return 'Event ' + num;
}
function getLocation(num) {
    return 'A' + num;
}
function getStatus(num) {
    if (num % 2 === 0) {
        return 'Incomplete';
    } else {
        return 'Complete';
    }
}
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