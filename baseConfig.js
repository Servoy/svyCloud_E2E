var startDate;
var conf = require('./config.json');
var jsonDirectory = 'reports/cucumber_reports/';

exports.config = {
  seleniumAddress: 'http://127.0.0.1:4444/wd/hub',
  framework: 'custom',
  params: {
    testDomainURL: '',
    screenshotDirectory: 'reports/screenshots/',
    htmlDirectory: 'reports/html_reports/'
  },
  // path relative to the current config file
  frameworkPath: require.resolve('protractor-cucumber-framework'),

  cucumberOpts: {
    require: ['features/step_definitions/servoy_step_definitions_firefox.js',
      'env.js',
      'features/step_definitions/hooks.js'],
    tags: false,
    // format: 'pretty',
    format: ['json:reports/cucumber_reports/report.json', 'pretty'],
    profile: false,
    keepAlive: false,
    'no-source': true
  },

  beforeLaunch: () => {
    console.log("beforeLaunch");
    var fs = require('fs-extra');
    fs.emptyDirSync(jsonDirectory);
    startDate = new Date();
  },

  onPrepare: () => {
    console.log('onPrepare');
    // browser.driver.manage().window().maximize();
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