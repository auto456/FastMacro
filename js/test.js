//Required Modules
//Network & Utilities
const isOnline = require('is-online');
const utils = require('pi-utils');
//HTTP Request
const http = require('http');
const syncRequest = require('then-request');
//Synchronize Tasks
const sync = require('synchronize');
//FileSystem
const fs = require('fs');
const childProcess = require('child_process');
//GPIO
var gpio = require('onoff').Gpio;
//MPC ADC Wandler MPC3208
var mcpadc = require('mcp-adc');
//Sleep
var sleep = require('sleep').sleep;


sync.fiber(function () {
	//Get Config
	var szConfig = sync.await(fs.readFile('/var/www/html/config.json', sync.defer()));
	var aConfig = JSON.parse(szConfig);

	var szToken = sync.await(fs.readFile('/var/www/html/token.txt', sync.defer()));

	//Get Start Time
	var szTimeStart = aConfig['time_start'];
	var aTimeStart = szTimeStart.split(":");
	var iTimeStartH = aTimeStart[0];
	var iTimeStartM = aTimeStart[1];

	//Get End Time
	var szTimeEnd = aConfig['time_end'];
	var aTimeEnd = szTimeEnd.split(":");
	var iTimeEndH = aTimeEnd[0];
	var iTimeEndM = aTimeEnd[1];

	function calcTemp(iValue) {
		return iValue;
	}

	var timeNow = new Date();
	var inTime = 0;
	console.log('##############################################################################');
	console.log('##############################################################################');
	console.log('##############################################################################');
	console.log('SENDING TEMP at ' + timeNow.getHours() + ':' + timeNow.getMinutes() + 'h');

	//Get connection Mode
	var connectionType = (fs.readFileSync('/var/www/html/curState')).toString();
	console.log('Connection Type: ' + connectionType);
	console.log('##############################################################################');




	if (timeNow.getHours() > iTimeStartH && timeNow.getHours() < iTimeEndH) inTime = 1;
	else if (timeNow.getHours() == iTimeStartH && timeNow.getMinutes() >= iTimeStartM) inTime = 1;
	else if (timeNow.getHours() == iTimeEndH && timeNow.getMinutes() < iTimeEndM) inTime = 1;

	if (inTime === 1) {
		var getTempURL = 'http://localhost/get_temp.php';
		var tempMonURL = 'http://www.menue-catering.de/api/temp_mon/write.php?token=';

		var mcpadc = require('mcp-adc');

		var adc = new mcpadc.Mcp3208();

		adc.readRawValue(0, function (value0) {
			var iTemp2 = value0;
			adc.readRawValue(1, function (value1) {
				var iTemp1 = value1;
				console.log("Temp1: " + iTemp1);
				console.log("Temp2: " + iTemp2);

				if (iTemp1 == 0) //iTemp1 > 4000
					console.log("ERROR Temp1! Very cold, maybe not connected?");
				if (iTemp2 == 0) //iTemp2 > 4000
					console.log("ERROR Temp2! Very cold, maybe not connected?");
				else {
					// Getting data before checking for internet
                    var connectionType = (fs.readFileSync('/var/www/html/curState')).toString();
                    if (fs.existsSync('/var/www/html/gpsData')) {
                        var curGPSData = (fs.readFileSync('/var/www/html/gpsData')).toString();
                    }
                    
					if (connectionType == 'WLAN') {
						var wlan = 1;
						var umts = 0;
					} else if (connectionType = "UMTS") {
						var wlan = 0;
						var umts = 1;
					} else {
						var wlan = 0;
						var umts = 0;
					}
					var curTime = new Date();
					var timestamp = curTime;
					var offlineData = {
						available: 0
					}
					var curData = {
						timestamp: timestamp,
						temperature_1: iTemp1,
						temperature_2: iTemp2,
						wlan: wlan,
						umts: umts
					};
					var offlineDataString1 = (fs.readFileSync('/var/www/html/offlineData')).toString();
					if (offlineDataString1 == '') {
						console.log('Offline Data are available stored localy');
						offlineData.available = 0;
					} else {
						offlineData.available = 1;
					}

					console.log('Checking for Internet');
					isOnline().then(online => {
						if (online) {
							console.log('Connected');
							if (offlineData.available == 1) {
								console.log('Trying to send offline data: ');
								var offlineDataFileString = fs.readFileSync('/var/www/html/offlineData').toString();
								syncRequest('POST', tempMonURL + szToken, {
									json: {
										offlineData: '{"data:":[' + offlineDataFileString + ']}'
									}
								}).getBody('utf8').then(JSON.parse).done(function (res) {
									var sendResponse = res;
									if (sendResponse['success'] == true) {
										var redLED = new gpio(23, 'out');
										redLED.writeSync(0);
										console.log('Offline data send successfully!')
										fs.writeFileSync('/var/www/html/offlineData', '');
										offlineData.available == 0;
									} else {
										console.log('Offline data send failed!')
										offlineData.available == 1;
									}

								});

							}
                            if(typeof curGPSData !== 'undefined'){
                                tempMonURL = tempMonURL + szToken + '&temperature_1=' + iTemp1 + '&temperature_2=' + iTemp2 + '&wlan=' + wlan + '&umts=' + umts + curGPSData;
                            } else{
                                tempMonURL = tempMonURL + szToken + '&temperature_1=' + iTemp1 + '&temperature_2=' + iTemp2 + '&wlan=' + wlan + '&umts=' + umts;
                            }
							console.log("Sending HTTP Request with Params: " + tempMonURL);
							syncRequest('GET', tempMonURL).done(function (res) {
								aTempMonRes = JSON.parse(res.getBody());
								var success = aTempMonRes['success'];
								var terminalId = aTempMonRes['terminal_id'];

								if (aTempMonRes['wlan'] !== undefined) {
									var wlan = aTempMonRes['wlan']['ssid'] + " " + aTempMonRes['wlan']['key'];
									console.log("Got new network as response: " + wlan);

									fs.writeFile("/var/www/html/wifi.config", wlan, (err) => {
										if (err) throw err;
										console.log("ERROR writing file, maybe check Permissions?");
									});

									childProcess.exec('sudo php /var/www/set_wifi.php &');
									childProcess.exec('sudo reboot');

									syncRequest('GET', 'http://www.menue-catering.de/api/temp_mon/write.php?token=' + szToken + '&wlanChanged=1').done(function (res) {
										aReqRes = JSON.parse(res.getBody());
										if (!aReqRes['success'] == true) console.log('ERROR: ' + aReqRes['message']);
									});
								}

								if (success) {
                                    console.log('Data send successfully!');
                                    console.log('Removing old gpsData')
                                    childProcess.exec('sudo rm /var/www/html/gpsData');
									var greenLED = new gpio(16, 'out');
									var blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250ms

									function blinkLED() { //function to start blinking
										if (greenLED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
											greenLED.writeSync(1); //set pin state to 1 (turn LED on)
										} else {
											greenLED.writeSync(0); //set pin state to 0 (turn LED off)
										}
									}

									function endBlink() { //function to stop blinking
										clearInterval(blinkInterval); // Stop blink intervals
										greenLED.writeSync(1); // Turn LED off
										//greenLED.unexport(); // Unexport GPIO to free resources
									}

									setTimeout(endBlink, 3000); //stop blinking after 3 seconds
								} else {
									if (aTempMonRes['message'] != undefined) {
										console.log('ERROR: ' + aTempMonRes['message']);
										fs.writeFile("/var/www/html/error.txt", aTempMonRes['message']);
									}
								}

							});
							var connectionType = (fs.readFileSync('/var/www/html/curState')).toString();
							if (connectionType === 'UMTS') {
								console.log('Connection established with UMTS, checking if WIFI is available...');
								utils.wifi.getCurrentNetwork().then(ssid => {
									if (ssid) {
										console.log('WIFI Connection done again with Network ' + ssid + '. Deactivating UMTS.');
										childProcess.execSync('sudo ifconfig eth1 down');
										fs.writeFileSync('/var/www/html/curState', 'WLAN');
										console.log('Killing node.js app.');
										sleep(3);
										process.exit(0);
									} else {
										console.log('No WIFI Network found. Staying with UMTS.');
									}
								});
							}
						} else {
							console.log("No Internet connection established yet. Saving TempData for submitting them later.");
							var redLED = new gpio(23, 'out');

							if (offlineData.available == 1) {
								redLED.writeSync(1);
								var curDataJSON = JSON.stringify(curData);
								fs.readFile('/var/www/html/offlineData', function (err, curOfflineData) {
									if (err) throw err;
									if (curOfflineData) {
										var newOfflineData = curOfflineData + ',' + curDataJSON;
										fs.writeFileSync('/var/www/html/offlineData', newOfflineData);
										console.log('Saved missing data while offline!');
										offlineData.available = 1;
									}
								});
							} else if (offlineData.available == 0) {
								redLED.writeSync(1);
								var curDataJSON = JSON.stringify(curData);
								fs.appendFile('/var/www/html/offlineData', curDataJSON, function (err) {
									if (err) throw err;
									console.log('Saved missing data while offline!');
								});
								offlineData.available = 1;
							}
							//var szError = aTempMonRes['message'];
							// console.log("ERROR: No Connection on UMTS. Maybe no Signal? Retrying in 1 Minute.");
							var connectionType = (fs.readFileSync('/var/www/html/curState')).toString();
							if (connectionType === 'WLAN') {
								console.log("Checking if still connected to WIFI.");
								utils.wifi.getCurrentNetwork().then(ssid => {
									if (ssid) {
										console.log("Still connected to WIFI with Network " + ssid + ". Retrying to send data in 1 Minute.");
									} else {
										console.log("WIFI Connection lost. Switching to UMTS");
										console.log("Activating UMTS Stick...");
										childProcess.execSync('sudo ifconfig eth1 up');

										//TODO: Maybe deactivating WLAN0 iface???
										fs.writeFileSync('/var/www/html/curState', 'UMTS');
										sleep(3);
										console.log("UMTS Stick Activated.");
										console.log("Now checking for network connectivity.");
										isOnline().then(online => {
											if (online) {
												console.log("Connected, retrying to send data in 1 Minute.");
											} else {
												console.log("No Internet Connection, maybe no signal? Retrying in 1 Minute.");
											}
										});
									}
								});
							}
						}
					});
				}
			});
		});
	}
});