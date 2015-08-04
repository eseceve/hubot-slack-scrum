# hubot-slack-scrum
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage Status][coveralls-image]][coveralls-url]

A hubot script that does a virtual scrum meeting with the Slack's hubot adapter

See [`src/slack-scrum.js`](src/slack-scrum.js) for full documentation.

## Installation

In hubot project repo, run:

`npm install hubot-slack-scrum --save`

Then add **hubot-slack-scrum** to your `external-scripts.json`:

```json
["hubot-slack-scrum"]
```

## Sample Interaction

```
user1>> hubot hello
hubot>> hello!
```


[npm-url]: https://npmjs.org/package/hubot-slack-scrum
[npm-image]: http://img.shields.io/npm/v/hubot-slack-scrum.svg?style=flat
[travis-url]: https://travis-ci.org/eseceve/hubot-slack-scrum
[travis-image]: http://img.shields.io/travis/eseceve/hubot-slack-scrum/master.svg?style=flat
[daviddm-url]: https://david-dm.org/eseceve/hubot-slack-scrum.svg?theme=shields.io
[daviddm-image]: http://img.shields.io/david/eseceve/hubot-slack-scrum.svg?style=flat
[coveralls-url]: https://coveralls.io/r/eseceve/hubot-slack-scrum
[coveralls-image]: http://img.shields.io/coveralls/eseceve/hubot-slack-scrum/master.svg?style=flat
