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
//   hubot scrum start
//   next
//   next user <reason>
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


module.exports = function scrum(robot) {
  var slackAdapterClient = robot.adapter.client;

  robot.respond(/scrum start/i, start);
  robot.hear(/next/i, next);
  robot.hear(/next user(.*)/i, nextUser);


  function start(res) {
    var channel = _getChannel(res.message.room);
    var scrum;

    if (_scrumExists(channel)) return;
    scrum = _getScrum(channel);
    res.send("Hi <!channel>, let's start a new Scrum");

    _doQuestion(scrum);
  }


  function next(res, force) {
    var channel = _getChannel(res.message.room);
    var scrum;

    if (!_scrumExists(channel)) return;
    if (!force && res.message.text.toLowerCase().trim() !== 'next') return;

    scrum = _getScrum(channel);

    if (scrum.question === QUESTIONS.length) return nextUser(res, true);
    _doQuestion(scrum);
  }


  function nextUser(res, force) {
    var channel = _getChannel(res.message.room);
    var text = res.message.text.toLowerCase();
    var reason;
    var scrum;
    var user;

    if (!_scrumExists(channel)) return;

    scrum = _getScrum(channel);
    reason = res.match[1];

    if (!force) {
      if (text.indexOf('next user') !== 0 || !scrum) return;
      if (!reason) return res.send(
        'Command `next user <reason>` require a <reason>');
    }

    if (reason) {
      user = scrum.members[scrum.user];
      scrum.reasons[user.id] = reason;
      robot.brain.set(_getScrumID(scrum.channel), scrum);
    } else {
      _saveAnswer(scrum);
    }

    scrum.user++;
    scrum.question = 0;
    if (scrum.user >= scrum.members.length) return _finish(scrum);
    next(res, true);
  }


  function _createScrum(channel) {
    var history = Object.keys(channel.getHistory()).reverse();
    var scrum = {
      answers: {},
      channel: channel,
      lastMessageTS: history[0],
      question: 0,
      reasons: {},
      user: 0
    };

    scrum.members = channel.members.map(function getUserObject(userID) {
      var user = slackAdapterClient.getUserByID(userID);
      return user;
    }).filter(function filterBots(user) {
      return !user.is_bot;
    });

    return scrum;
  }


  function _doQuestion(scrum) {
    var user = scrum.members[scrum.user];
    var message = '<@' + user.id + '> ' + QUESTIONS[scrum.question];

    _saveAnswer(scrum);
    scrum.channel.send(message);
    scrum.question++;
  }


  function _finish(scrum) {
    _saveAnswer(scrum);
    scrum.channel.send("Thanks <!channel> for participating =)");
    // TODO: send email summary
    robot.brain.set(_getScrumID(scrum.channel), false);
  }


  function _getChannel(roomName) {
    var channel = slackAdapterClient.getChannelByName(roomName);

    if (!channel) channel = slackAdapterClient.getGroupByName(roomName);
    if (!channel) throw new Error('Room must be a channel or group');

    return channel;
  }


  function _getScrum(channel) {
    var scrum;

    if (_scrumExists(channel)) return robot.brain.get(_getScrumID(channel));

    scrum = _createScrum(channel);
    robot.brain.set(_getScrumID(channel), scrum);

    return scrum;
  }


  function _getScrumID(channel) {
    return 'HSS-'+channel.id;
  }


  function _saveAnswer(scrum) {
    // TODO: only save current answer
    // TODO: prevent save `undefined` question
    var firstMessage = true;
    var history = scrum.channel.getHistory();
    var noMore = false;
    var user = scrum.members[scrum.user];
    var lastMessageTS;

    if (!user || !scrum.question) return;

    scrum.answers[user.id] = scrum.answers[user.id] || [];
    scrum.answers[user.id][scrum.question-1] = Object.keys(history)
      .reverse()
      .filter(function checkMessage(messageTS) {
        var message = history[messageTS];
        var filtered = true;

        if (firstMessage) {
          lastMessageTS = messageTS;
          firstMessage = false;
          return false;
        }
        if (noMore) return false;
        if (!message) return false;
        if (message.user !== user.id) return false;

        if (message.text.indexOf('next') === 0 ||
          scrum.lastMessageTS === messageTS) {
          noMore = true;
          filtered = false;
        }

        return filtered;
      })
      .map(function getText(messageTS) {
        return history[messageTS].text;
      })
      .reverse();

    scrum.lastMessageTS = lastMessageTS;
    robot.brain.set(_getScrumID(scrum.channel), scrum);
  }


  function _scrumExists(channel) {
    return !!robot.brain.get(_getScrumID(channel));
  }
};
