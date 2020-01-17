const SlackBot = require('slackbots');
const axios = require('axios');

const bot = new SlackBot({
    token: `${process.env.BOT_TOKEN}`,
    name: 'jamesbot'
});

function yoMamaJoke() {
    axios.get('http://api.yomomma.info').then(response => {
        const joke = response.data.joke;

        bot.postMessageToChannel('general', `${joke}`);
    });
};

module.exports = yoMamaJoke