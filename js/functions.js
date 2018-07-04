// GLOBAL VAR
var stepArray;

window.onload = function () {
    if (document.getElementsByClassName("red").length == 1) {
        var activeButton = document.getElementsByClassName("red");
        activeButton[0].setAttribute('src', "img/button_red.png");
    }
    var length = setTimeout(function () {
        loadXMLforLenghth("K5_Macros_V2.xml");
    }, 10);

    console.log("Hi, today we have " + length + " Macros :)");
    var elements = document.getElementsByClassName("button");
    for (var i = 0; i < length; i++) {
        elements[i].setAttribute('src', "img/button_yellow.png");
    }

}

//load xml initally to see how much macros exist
function loadXMLforLenghth(xmlFile) {
    var xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for older browsers
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            return this.responseXML.getElementsByTagName("Macro").length;
        }
    };

    xmlhttp.open("GET", "xml/" + xmlFile, true);
    xmlhttp.send();
}



function testLoadXML(macroIndex, xmlFile) {
    var xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for older browsers
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            testFunction(this, macroIndex);
        }
    };
    xmlhttp.open("GET", "xml/" + xmlFile, true);
    xmlhttp.send();
}

function testFunction(xml, macroIndex) {
    var x, xmlDoc;
    xmlDoc = xml.responseXML;
    x = xmlDoc.getElementsByTagName("Macro");
    var index = x[macroIndex].attributes[0].nodeValue;
    var name = x[macroIndex].attributes[1].nodeValue;
    var description = x[macroIndex].attributes[2].nodeValue;
    var steps = x[macroIndex].childNodes;


    stepArray = wrapSteps(steps);

    document.getElementById("activeMacroIndex").innerHTML = index;
    document.getElementById("activeMacroTitel").innerHTML = name;
    document.getElementById("activeMacroDescription").innerHTML = description;

    var stepString = "";
    for (var i = 0; i <= stepArray.length; i++) {
        if (stepArray[i] !== undefined) {
            stepString += '<p id="step" onclick="openDetail('+ i + ')">' + stepArray[i].title + '</p>\n';
        }
    }
    document.getElementById("steps").innerHTML = stepString;
}

function openDetail(stepArrayIndex){
    document.getElementById("detail").innerHTML = wrapDetail(stepArray[stepArrayIndex]);

}

function onClick(element) {
    if (document.getElementsByClassName("red").length == 1) {
        var activeButton = document.getElementsByClassName("red");
        activeButton[0].setAttribute('src', "img/button_yellow.png");
        activeButton[0].className = activeButton[0].className.replace(" red", "");
    }
    element.className += " red";
    element.setAttribute('src', "img/button_red.png");
    var macroIndex = element.attributes[3].nodeValue;
    testLoadXML(macroIndex, "K5_Macros_V2.xml");
}