var fs = require('fs');
var httpIndexFile = '/usr/lib/node_modules/protractor/node_modules/selenium-webdriver/http/index.js';
fs.readFile(httpIndexFile, 'utf8', function (err, data) {
if (err)
    throw err;
var result = data.replace(/\(e.code === 'ECONNRESET'\)/g, "(e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED')");
console.log(`Patching ${httpIndexFile}`)
fs.writeFileSync(httpIndexFile, result, 'utf8');});
var chromeFile = '/usr/lib/node_modules/protractor/node_modules/selenium-webdriver/chrome.js';
fs.readFile(chromeFile, 'utf8', function (err, data) {
if (err)
    throw err;

var result = data.replace(/new http.HttpClient\(url\)/g, "new http.HttpClient(url, new (require('http').Agent)({ keepAlive: true }))");
console.log(`Patching ${chromeFile}`)
fs.writeFileSync(chromeFile, result, 'utf8');});