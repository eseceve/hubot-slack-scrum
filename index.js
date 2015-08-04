var fs = require('fs');
var path = require('path');

module.exports = function slackScrum(robot, scripts) {
  var scriptsPath = path.resolve(__dirname, 'src');
  fs.exists(scriptsPath, function (exists) {
    if (!exists) return;
    fs.readdirSync(scriptsPath).forEach(function loadScript(script) {
      if (scripts && scripts.indexOf('*') === -1 &&
        scripts.indexOf(script) !== -1) {

        robot.loadFile(scriptsPath, script);
      } else {
        robot.loadFile(scriptsPath, script);
      }
    });
  });
};
