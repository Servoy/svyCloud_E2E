var startDate;
var conf = require('./features/config.json');
var jsonDirectory = 'reports/cucumber_reports/';
var customStepsDirectory = 'features/custom_step_definitions/custom_step_definitions.js';
exports.config = {
  seleniumAddress: 'http://127.0.0.1:4444/wd/hub',
  framework: 'custom',

  params: {
    testDomainURL: '',
    screenshotDirectory: 'reports/screenshots/',
    jsonDirectory: 'reports/cucumber_reports/'
  },

  frameworkPath: require.resolve('protractor-cucumber-framework'),

  cucumberOpts: {
    require: ['step_definitions/servoy_step_definitions_chrome.js',
      './lib/afterScenario.js',
      customStepsDirectory],
      format: 'json:./reports/json_reports/results.json',
      strict: true
  },

  plugins: [{
    package: require.resolve('protractor-multiple-cucumber-html-reporter-plugin'),
    options:{
      automaticallyGenerateReport: true,
      removeExistingJsonReportFile: true,
      customMetadata: false,
      displayDuration: true,
      durationInMS: true,
      pageTitle: "E2E Test Results",
      jsonOutputPath: "./reports/cucumber_reports",
      pageFooter: "<div style='width:100%; text-align:center'><a href='https://source.servoy.com/projects/SC/repos/qapaas-e2e/browse'; target='_blank'>Github</a></div>",
      reportName: "E2E-test-results"
    }
  }],

  beforeLaunch: () => {
    console.log("beforeLaunch");
    var fs = require('fs-extra');
    fs.emptyDirSync(jsonDirectory);
    startDate = new Date();
  },

  onPrepare: () => {
    console.log('onPrepare');
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
  }
};

for (var x in conf.configurations) {
  exports.config[x] = conf.configurations[x];
}