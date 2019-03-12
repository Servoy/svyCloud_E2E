const {After} = require('cucumber');
const {Status} = require('cucumber');
const {resolve} = require('path');
const fs = require('fs');

const diffFolder = resolve(process.cwd(), '.tmp/report/screenshots/image-comparison/diff/');
const screenshotFolder = resolve(process.cwd(), '.tmp/screenshots/');

/**
 * The After hook that checks the scenario status and creates a
 * screemshot if needed
 */
After(async function (scenarioResult) {  
  const world = this;
  if (scenarioResult.status === Status.FAILED) {
    console.log('Scenario failed at ' + scenarioResult.scenario.feature.uri);
    // Attach the original state
    let screenshot = await browser.takeScreenshot().catch(function(error) {
      console.log('Error taking screenshot!');
      console.log('Error: ' + error.message);
    })
    
    if(screenshot) {
      this.attach(screenshot, 'image/png');
    }
    
    
    // Only attach it if we added the name to the browserobject
    if (browser.imageComparisonName) {
      // attach the difference

      let decodedScreenshot = await getDifferenceScreenshot().catch(function() {
        console.log('Error creating screenshot!');
        console.log('Error: ' + error.message);
      })
      // Attach the diff to the report
      world.attach(decodedScreenshot, 'image/png');
    }
  }

  return Promise.resolve(scenarioResult.status);
});

/**
 * Get the difference screenshot
 */
async function getDifferenceScreenshot() {
  // This is the format of the image that you save, check your own format string of the saved images
  const searchString = `${browser.imageComparisonName}-${browser.browserName}`;
  const imageComparisonScreenshotDiffPath = diffFolder;
  // Find the path of the file
  const filePath = await(retrieveFullFilePathBySearchCriteria(imageComparisonScreenshotDiffPath, searchString));

  // Get the screenshot
  screenshot = await(fileUtils.retrieveFileBuffer(filePath));
  return new Buffer(screenshot, 'base64');
}

/**
 * Return the path of a file based on the search criteria
 */
async function retrieveFullFilePathBySearchCriteria(filePath, searchString) {
  return new Promise((resolve, reject) => {
    fs.readdir(filePath, (err, files) => {
      if (err) {
        return reject(`Error reading directory, error: ${err}`);
      }

      const foundFile = files.map(file => path.join(filePath, file))
        .filter(file => fs.statSync(file).isFile())
        .find(file => file.indexOf(searchString) > -1);

      if (!foundFile) {
        return reject(`Error: No matching files are found for ${searchString} in ${filePath}`);
      }

      return resolve(foundFile);
    });
  });
}