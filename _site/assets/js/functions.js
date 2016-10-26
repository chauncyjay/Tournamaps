var $, console; //STUPID JSLINT STUFF
var EVENT_URL = 'bracket-example-1.html',
    MAP_URL = 'map.html',
    STATUS_URL = '',
    PRIZED_URL = '',
    BRACKET_LIST_HTML = 'bracketlist.html',
    i;

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
$(document).ready(function () {
    
    //Use this to make tables added dynamically sortable
    //Documentation: http://www.kryogenix.org/code/browser/sorttable/
    //sorttable.makeSortable(newTableObject);
    
    if ($(location).attr('pathname') === '/' + BRACKET_LIST_HTML) {  //only runs on bracket list 
        for (i = 1; i < 4; i += 1) {

            //create string and add tags and name
            var tableString = '<tr><td><div onclick="location.href=\'' + EVENT_URL + '\'\">' + getEvent(i) + '</div></td>';

            //add more tags and location
            tableString += '<td><div onclick=\"location.href=\'' + MAP_URL + '\'\">' + getLocation(i) + '</div></td>';

            //add more tags and status
            tableString += '<td><div onclick=\"location.href=\'' + STATUS_URL + '\'\">' + getStatus(i) + '</div></td>';

            tableString += '<td><div onclick=\"location.href=\'' + PRIZED_URL + '\'\">' + getPrized(i) + '</div></td></tr>';

            //console.log(tableString);

            $('#brackets').find('tbody:last').append(tableString);
        }
    }
});