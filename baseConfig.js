var startDate;
var conf = require('./features/config.json');
var jsonDirectory = 'reports/cucumber_reports/';
var customStepsDirectory = 'features/custom_step_definitions/custom_step_definitions.js';
var fs = require('fs-extra');
exports.config = {
  // directConnect: true,
  seleniumAddress: 'http://127.0.0.1:4444/wd/hub',
  framework: 'custom',

  params: {
    testDomainURL: '',
  screenshotDirectory: 'reports/screenshots/',
    jsonDirectory: 'reports/cucumber_reports/'
},
  allScriptsTimeout: 360 * 1000,
  frameworkPath: require.resolve('protractor-cucumber-framework'),

  cucumberOpts: {
    require: ['step_definitions/servoy_step_definitions_chrome.js',
      './lib/afterScenario.js',
      customStepsDirectory],
      format: 'json:./reports/json_reports/results.json',
      strict: true,
      tags: [

      ]
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
      pageFooter: "<div style='width:100%; text-align:center'><a href='https://github.com/Servoy/svyCloud_E2E'; target='_blank'>Github</a></div>",
      reportName: "E2E-test-results"
    }
  }],

  beforeLaunch: () => {
    console.log("beforeLaunch");
    fs.emptyDirSync(jsonDirectory);
    startDate = new Date();
  },

  onPrepare: () => {
    console.log('onPrepare');
    if(browser.params.E2E_VAR_FULLSCREEN) {
      browser.driver.manage().window().maximize();
    }

    var base_html = '<html><body>'
    fs.writeFile(browser.params.htmlDirectory + '/admin_logs.html', base_html, function(err) {
      if(err) {
        console.log('Error creating admin log file!!');
      }
      console.log('File created');
    });
  },

  onComplete: () => {
    browser.sleep(5000).then(function() {
      console.log('onComplete');
      fs.appendFile(browser.params.htmlDirectory + '/admin_logs.html', '</body></html>');
    })
  },

  onCleanUp: (exitCode) => {
    console.log('onCleanUp');
    if(exitCode != 0) {
      process.exit(exitCode);
    }
  },

  afterLaunch: () => {
    console.log('afterLaunch');
    console.log('Test(s) ended after: ' + ((new Date() - startDate) / 1000) + ' seconds.');
  }
};

for (var x in conf.configurations) {
  if(Object.keys(conf.configurations[x]) == 'tags') {
    for(var key in conf.configurations[x]) {
      for(var tag in conf.configurations[x][key]) {
        exports.config.cucumberOpts.tags.push(conf.configurations[x][key][tag]);
      }
    }
  } else {
    exports.config[x] = conf.configurations[x];  
  }  
}
