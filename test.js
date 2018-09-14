var express = require('express');
var path = require('path');
var app = express();

// app.use(express.bodyParser());

app.get('/callMacro/:version', function (req, res) {
    var ATEM = require('C:/Projekte/test/js/applest-atem/lib/atem.js');

var atem = new ATEM();
console.log('try to connect');
atem.connect('192.168.10.100'); // Replace your ATEM switcher. address.

atem.on('connect', function(index) {
  // atem.changeProgramInput(1);
  // atem.changePreviewInput(2);
  // atem.autoTransition(1);
  atem.runMacro(index);
  // console.log(atem.state); // or use this.

  // setTimeout(function() {
  //   atem.startRecordMacro(98, 'Test Macro', 'Hey! This is macroman.');
  //   // atem.sendAudioLevelNumber()
  // }, 5000)

});
  });

// app.use('/', express.static('public'));
app.use('/js',express.static(path.resolve(__dirname, 'C:/Projekte/test/js/')));
app.use('/vendor',express.static(path.resolve(__dirname, 'C:/Projekte/test/vendor/')));
app.use('/img',express.static(path.resolve(__dirname, 'C:/Projekte/test/img/')));
app.use('/xml',express.static(path.resolve(__dirname, 'C:/Projekte/test/xml/')));
app.use('/style.css',express.static(path.resolve(__dirname, 'C:/Projekte/test/style.css')));
app.use('/wrapper.css',express.static(path.resolve(__dirname, 'C:/Projekte/test/wrapper.css')));

app.get('/', function (req, res) {
    res.sendFile("C:/Projekte/test/index.html");
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
