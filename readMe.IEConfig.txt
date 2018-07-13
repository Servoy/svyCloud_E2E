Manually download the 32 bit driver from: http://selenium-release.storage.googleapis.com/index.html?path=3.4/ 
webdriver-manager start --versions.standalone 3.4.0 --versions.ie 3.4.0 --ie32 
Make sure the path to the driver in the path variables is set
You NEED the 32bit driver. The 64bit driver works, but it is has a lot of issues e.g. very slow processing of sending keys to the browser
IE capabilities:
-- Enable Protected Mode on for ALL zones (IE-->options-->security)
-- IEDriverServer3.4.0 has to be started
add regkey: https://heliumhq.com/docs/internet_explorer