// Description:
//   [description]
//
// Dependencies:
//   hubot-slack
//
// Configuartion:
//   HUBOT_SLACKSCRUM_QA
//   HUBOT_SLACKSCRUM_QB
//   HUBOT_SLACKSCRUM_QC
//
// Commands:
//   scrum start
//   scrum next question
//   scrum next user
//   scrum end
//
// Author:
//   @eseceve
var env = process.env;

var QUESTIONS = [
  env.HUBOT_SLACKSCRUM_QA ||
    'What did you do yesterday that helped the development team meet the' +
    ' sprint goal?',
  env.HUBOT_SLACKSCRUM_QB ||
    'What will you do today to help the development team meet the sprint goal?',
  env.HUBOT_SLACKSCRUM_QC ||
    'Do you see any impediment that prevents me or the development team from' +
    ' meeting the sprint goal?'
];


var INITIAL_MESSAGE = env.HUBOT_SLACKSCRUM_INITIAL_MESSAGE || 
  'Initial message';
var FINAL_MESSAGE = env.HUBOT_SLACKSCRUM_FINAL_MESSAGE || 
  'Final message';


module.exports = function scrum(robot) {
  var slackAdapterClient = robot.adapter.client;
  var scrums = [];

  robot.respond(/scrum start/i, start);
  robot.respond(/scrum next question/i, question);
  robot.respond(/scrum next user/i, next);
  robot.respond(/scrum end/i, end);


  /**
   *
   * @jsdoc function
   * @name start
   * @description
   *
   * [description]
   *
   * @param {Object} res [description]
   *
   */
  function start(res) {
    var channel = _getChannel(res);
    var scrum;

    if (scrums[channel.id]) return;
    scrum = _getScrum(channel, true);
    if (INITIAL_MESSAGE) res.send(INITIAL_MESSAGE);
    _doQuestion(scrum);
  }


  /**
   *
   * @jsdoc function
   * @name end
   * @description
   *
   * [description]
   *
   * @param {Object} res [description]
   *
   */
  function end(res) {
    var channel = _getChannel(res);
    var scrum = _getScrum(channel);
    if (!scrum) return _requireStart(res);
    _saveAnswer(scrum);
    // TODO: send email summary
    if (FINAL_MESSAGE) res.send(FINAL_MESSAGE);
    res.send('summary:');
    res.send('` '+ JSON.stringify(scrum.answers) +' `');
    scrums[channel.id] = false;
  }


  /**
   *
   * @jsdoc function
   * @name next
   * @description
   *
   * [description]
   *
   * @param {Object} res [description]
   *
   */
  function next(res) {
    var channel = _getChannel(res);
    var scrum = _getScrum(channel);
    if (!scrum) return _requireStart(res);
    _saveAnswer(scrum);
    scrum.user++;
    scrum.question = 0;
    if (scrum.user >= scrum.members.length) return end(res);
    question(res);
  }


  /**
   *
   * @jsdoc function
   * @name question
   * @description
   *
   * [description]
   *
   * @param {Object} res [description]
   *
   */
  function question(res) {
    var channel = _getChannel(res);
    var scrum = _getScrum(channel);
    if (!scrum) return _requireStart(res);
    if (scrum.question === QUESTIONS.length) return next(res);
    _doQuestion(scrum);
  }


  /**
   *
   * @jsdoc function
   * @name _doQuestion
   * @private
   * @description
   *
   * [description]
   *
   * @param {Object} scrum [description]
   *
   */
  function _doQuestion(scrum) {
    var user = scrum.members[scrum.user];
    var message = '<@' + user.id + '> ' + QUESTIONS[scrum.question];
    _saveAnswer(scrum);
    scrum.channel.send(message);
    scrum.question++;
  }


  /**
   *
   * @jsdoc function
   * @name _getScrum
   * @private
   * @description
   *
   * [description]
   *
   * @param  {Object} res [description]
   * @param  {Boolean=} start [description]
   * @return {Object|Boolean}
   *
   */
  function _getScrum(channel, start) {
    var scrum = scrums[channel.id];
    if (scrum) return scrum;
    if (!scrum && !start) return false;
    scrum = {
      answers: {},
      channel: channel,
      question: 0,
      user: 0
    };
    scrum.members = channel.members.map(function getUserObject(userID) {
      var user = slackAdapterClient.getUserByID(userID);
      return user;
    }).filter(function filterBots(user) {
      return !user.is_bot;
    });
    scrums[channel.id] = scrum;
    return scrum;
  }


  /**
   *
   * @jsdoc function
   * @name _getChannel
   * @private
   * @description
   *
   * [description]
   *
   * @param  {Object} res [description]
   * @return {Object}
   *
   */
  function _getChannel(res) {
    var roomName = res.message.room;
    var channel = slackAdapterClient.getChannelByName(roomName);
    if (!channel) { channel = slackAdapterClient.getGroupByName(roomName); }
    if (!channel) { throw new Error('Room must be a channel or group'); }
    return channel;
  }


  /**
   *
   * @jsdoc function
   * @name _requireStart
   * @private
   * @description
   *
   * [description]
   *
   * @param  {Object} res [description]
   *
   */
  function _requireStart(res) {
    res.send('Require `scrum start` command');
  }


  /**
   *
   * @jsdoc function
   * @name _saveAnswer
   * @private
   * @description
   *
   * [description]
   *
   * @param  {Object} scrum [description]
   *
   */
  function _saveAnswer(scrum) {
    var history = scrum.channel.getHistory();
    var noMore = false;
    var user = scrum.members[scrum.user];
    if (!user || !scrum.user && !scrum.question) return;
    scrum.answers[user.id] = scrum.answers[user.id] || {};
    scrum.answers[user.id][QUESTIONS[scrum.question-1]] = Object.keys(history)
      .reverse()
      .filter(function checkMessage(messageTS) {
        var message = history[messageTS];
        if (noMore) return false;
        if (!message) return false;
        if (message.user !== user.id) return false;
        if (message.text.indexOf('scrum ') !== -1) {
          noMore = true;
          return false;
        }
        return true;
      })
      .map(function getText(messageTS) {
        var message = history[messageTS];
        return message.text;
      })
      .reverse();
  }
};
