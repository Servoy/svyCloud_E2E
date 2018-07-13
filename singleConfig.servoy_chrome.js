var startDate;
var jsonDirectory = 'reports/cucumber_reports/';
var screenshotDir = 'reports/screenshots/';
exports.config = {
  seleniumAddress: 'http://127.0.0.1:4444/wd/hub',
  framework: 'custom',
  params: {
    screenshotDirectory: 'reports/screenshots/',
    htmlDirectory: 'reports/html_reports/',
    jsonDirectory: 'reports/cucumber_reports/'
  },
  // path relative to the current config file
  frameworkPath: require.resolve('protractor-cucumber-framework'),
  capabilities:{
    'browserName': 'chrome'
  },
  // multiCapabilities: [{
  //   'browserName': 'chrome'/*
  //   'platform': 'ANY',
  //   'version': '11'*/
  // }],

  // Spec patterns are relative to this directory.
  specs: [
    './features/*.feature'
  ],

  cucumberOpts: {
    require: ['features/step_definitions/servoy_step_definitions.js',
      'env.js',
  'features/step_definitions/hooks.js'],
    tags: false,
   format: ['json:reports/cucumber_reports/report.json', 'pretty'],
    profile: false,
    keepAlive: false,
    'no-source': true
  },

  beforeLaunch: () => {
    console.log('beforeLaunch');
    removeJsonReports(jsonDirectory);
    removeScreenshots(screenshotDir);
    startDate = new Date();
  },

  onPrepare: () => {
    browser.driver.executeScript(function () {
      return {
        width: window.screen.availWidth,
        height: window.screen.availHeight
      };
    }).then(function (result) {
      browser.driver.manage().window().setSize(result.width, result.height);
    });
  },

  onComplete: () => {
    console.log('onComplete');
  },

  onCleanUp: () => {
    console.log('onCleanUp');
  },

  afterLaunch: () => {
    console.log('afterLaunch');
    console.log('Test(s) ended after: ' + ((new Date() - startDate) / 1000) + ' seconds.');
  },
};

function removeJsonReports(jsonDirectory) {
  var find = require('find');
  var fs = require('fs-extra');
  var files = find.fileSync(/\.json/, jsonDirectory);
  files.map(function (file) {
    fs.unlinkSync(file);
  });
}

function removeScreenshots(screenshotDirectory) {
  var find = require('find');
  var fs = require('fs-extra');
  var files = find.fileSync(/\.png/, screenshotDirectory);
  files.map(function (file) {
    fs.unlinkSync(file);
  });
}