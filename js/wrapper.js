function wrapDetail(stepObject) {
    var detailString = '<form action="/action_page.php">';
    detailString += "<p id=detailTitle>" + stepObject.title + "</p>";

    if (stepObject.mixEffectBlockIndex !== undefined) {
        detailString += '<label id=mixEffectBlockIndex> ME: ';
        detailString += '<select name="mixEffectBlockIndex">';
        if (stepObject.mixEffectBlockIndex == 1) {
            detailString += '<option value=1 selected>1</option>';
            detailString += '<option value=2>2</option>';
        } else {
            detailString += '<option value=1>1</option>';
            detailString += '<option value=2 selected>2</option>';
        }

        detailString += '</select>';
    }
    if (stepObject.source !== undefined) {
        detailString += '<label id="TransitionSource">Source: ';
        detailString += '<select name="TransitionSource">';

        if(stepObject.source=='Key1'){
            detailString += '<option value=key1 selected>Key 1</option>';
        } else  detailString += '<option value=key1>Key 1</option>';

        if(stepObject.source=='Key2'){
            detailString += '<option value=key2 selected>Key 2</option>';
        } else  detailString += '<option value=key2>Key 2</option>';
        
        if(stepObject.source=='Background, Key2'){
            detailString += '<option value=key3 selected>Background, Key2</option>';
        } else  detailString += '<option value=key3>Background, Key2</option>';

        if(stepObject.source=='Background, Key2'){
            detailString += '<option value=key3 selected>Background, Key2</option>';
        } else  detailString += '<option value=key3>Background, Key2</option>';

        if(stepObject.source=='Background'){
            detailString += '<option value=key5 selected>Background</option>';
        } else detailString += '<option value=key5>Background</option>';

        detailString += '</select>';
    }
    return detailString;
}

//Delete every second entry because its just the unavailable name
//Returns "Clean" array containing all steps
function wrapSteps(steps) {
    var length = steps.length;
    var stepArray = [];

    for (var i = 1; i < length; i++) {
        var stepObject = new Object();

        switch (steps[i].attributes[0].nodeValue) {
            case 'TransitionSource':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Transition Source';
                stepObject.mixEffectBlockIndex = steps[i].attributes[1].nodeValue;
                stepObject.source = steps[i].attributes[2].nodeValue;
                break;
            case 'AutoTransition':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Auto Transition';
                stepObject.mixEffectBlockIndex = steps[i].attributes[1].nodeValue;
                break;
            case 'MacroUserWait':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Macro User Wait';
                break;
            case 'DownstreamKeyAuto':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Downstream Key Auto';
                stepObject.keyIndex = steps[i].attributes[1].nodeValue;
                break;
            case 'MacroSleep':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Macro Sleep';
                stepObject.frames = steps[i].attributes[1].nodeValue;
                break;
            case 'PreviewInput':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Preview Input';
                stepObject.mixEffectBlockIndex = steps[i].attributes[1].nodeValue;
                stepObject.input = steps[i].attributes[2].nodeValue;
                break;
            case 'AuxiliaryInput':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Auxiliary Input';
                stepObject.auxiliaryIndex = steps[i].attributes[1].nodeValue;
                stepObject.input = steps[i].attributes[2].nodeValue;
                break;
            case 'DVEAndFlyKeyXSize':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'DVE and Fly Key X Size';
                stepObject.mixEffectBlockIndex = steps[i].attributes[1].nodeValue;
                stepObject.keyIndex = steps[i].attributes[2].nodeValue;
                stepObject.xSize = steps[i].attributes[3].nodeValue;
                break;
            case 'DVEAndFlyKeyYSize':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'DVE and Fly Key Y Size';
                stepObject.mixEffectBlockIndex = steps[i].attributes[1].nodeValue;
                stepObject.keyIndex = steps[i].attributes[2].nodeValue;
                stepObject.ySize = steps[i].attributes[3].nodeValue;
                break;
            case 'SuperSourceArtAbove':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Super Source Art Above';
                stepObject.artAbove = steps[i].attributes[1].nodeValue;
                break;
            case 'SuperSourceArtFillInput':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Super Source Art Fill Input';
                stepObject.input = steps[i].attributes[1].nodeValue;
                break;
            case 'SuperSourceBoxEnable':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Super Source Box Enable';
                stepObject.boxIndex = steps[i].attributes[1].nodeValue;
                stepObject.enable = steps[i].attributes[2].nodeValue;
                break;
            case 'SuperSourceBoxInput':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Super Source Box Input';
                stepObject.boxIndex = steps[i].attributes[1].nodeValue;
                stepObject.input = steps[i].attributes[2].nodeValue;
                break;
            case 'MediaPlayerSourceStillIndex':
                stepObject.id = steps[i].attributes[0].nodeValue;
                stepObject.title = 'Media Player Source Still Index';
                stepObject.mediaPlayer = steps[i].attributes[1].nodeValue;
                stepObject.index = steps[i].attributes[2].nodeValue;
                break;
            default:
                console.log('Unknown attribute');
        }
        stepArray.push(stepObject);
        i++;
    }
    return stepArray;
}