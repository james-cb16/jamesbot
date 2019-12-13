const SlackBot = require('slackbots');
const axios = require('axios');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const clear = require('./delete-slack-messages');
const shell = require('shelljs');

dotenv.config();

app.get('/', (request, response) => {
    response.send('Testing 1998');
});

app.listen(3000, () => {
    console.log('Server started on port 3000...');
});

const bot = new SlackBot({
    token: `${process.env.BOT_TOKEN}`,
    name: 'jamesbot'
});

// Start Handler
bot.on('start', () => {
    const params = {
        icon_emoji: ':pensive_dab:'
    }

    bot.postMessageToChannel('general', 'jamesbot is ONLINE :pensive_dab:');

    console.log("Bot is online.");

    // bot.postMessageToChannel('general',
    //     'jamesbot is here :coolbutdepressed:',
    //     params);
});

// Error Handler
bot.on('error', (err) => console.log(err));

// Message Handler
bot.on('message', data => {
    if (data.type !== 'message') {
        return;
    }

    handleMessage(data.text);
});

// bot.on('message', message => {
//     switch (message) {
//         case '!ping':
//             bot.postMessageToChannel('pong!');
//             console.log('hi')
//             break;
//     };
// });

// Response to Data
// Use "!" prefix to post in #general channel
function handleMessage(message) {
    var message = message.split(' ')

    switch (message[0]) {
        case '!yomama':
            yoMamaJoke();
            break;
        case '!ping':
            bot.postMessageToChannel('general', 'pong!');
            break;
        case '!trivia':
            triviaGameAny();
            break;
        case '!trivia2':
            triviaGame2();
            break;
        case '!delete':
            clear.clear();
            break;
        case '!r':
            app.listen(8000);
            break;
        case '!help':
            bot.postMessageToChannel('general', 'Commands List: \n!yomama \n!ping \n!trivia \n!trivia2 \n!giphy [input]');
            break;
        case `!giphy`:
            message.shift()

            var searchQuery = message.join('-')
            console.log(message[1]);
            axios.get(`https://api.giphy.com/v1/gifs/search?q=` + searchQuery + `&api_key=` + `${process.env.GIF_API_KEY}` + '&limit=10&rating=pg').then(response => {

                var randomize = [Math.floor(Math.random() * response.data.data.length)];
                console.log(response.data.data[randomize].url);
                var gif = response.data.data[randomize].url;
                //var gif = response.data[randomize].images.downsized_medium.url;

                bot.postMessageToChannel('general', `${gif}`);
            });

            break;
        default: {
            if (message[0][0] === '!') {
                bot.postMessageToChannel('general', "sorry, that's not a command! :disappointed:");
            }
        }

    };

};

// Yo Mama Joke
function yoMamaJoke() {
    axios.get('http://api.yomomma.info').then(response => {
        const joke = response.data.joke;

        bot.postMessageToChannel('general', `${joke}`);
    });
};

// Trivia Game: Any Category/Type/Difficulty 10 Questions
let points = 0;

function triviaGameAny() {
    // switch (message) {
    //     case '':

    //     break;
    // }
    axios.get('https://opentdb.com/api.php?amount=10&category=9').then(response => {

        let answers = [
            response.data.results[0].correct_answer,
            response.data.results[0].incorrect_answers[0],
            response.data.results[0].incorrect_answers[1],
            response.data.results[0].incorrect_answers[2],
        ]

        let answerShuffle = function (arr) {
            let newPos, temp;
            for (let i = arr.length - 1; i > 0; i--) {
                newPos = Math.floor(Math.random() * (i + 1));
                temp = arr[i];
                arr[i] = arr[newPos];
                arr[newPos] = temp;
            }
            return arr;
        };

        let newArray = answerShuffle(answers);

        let shuffledAnswers = newArray.join(", ");

        let trivia = [
            "Category: " + response.data.results[0].category,
            "Difficulty: " + response.data.results[0].difficulty,
            "Question: " + response.data.results[0].question,
            "Choices: " + shuffledAnswers
        ].join("\n\n");

        bot.postMessageToChannel('general', `${trivia}`);

        console.log(trivia);
        console.log(response.data.results[0].correct_answer)

        bot.on('message', data => {
            if (data.type !== 'message') {
                return;
            }

            handleMessage(data.text);
        });

        function handleMessage(message) {

            if (message === response.data.results[0].correct_answer) {
                points++;
                bot.postMessageToChannel('general', 'Correct! \nPoints: ' + points)

                triviaGameAny();
            } else if (message === response.data.results[0].incorrect_answers[0] || message === response.data.results[0].incorrect_answers[1] || message === response.data.results[0].incorrect_answers[2]) {
                bot.postMessageToChannel('general', `Incorrect! The answer was: ${response.data.results[0].correct_answer}`)

                triviaGameAny();
            } else if (message === '!exit') {
                bot.postMessageToChannel('general', 'Trivia Game Ended. \nTotal Score: ' + points)
                points = 0;
                return;
            }

        }
    })

}

function triviaGame2() {
    bot.postMessageToChannel('general', 'Please choose a category: \nGeneral Knowledge, Books, Film, Music, Musicals, Television, Video Games, Board Games, Science & Nature, Science: Computers, Science: Mathematics, Mythology, Sports, Geography, History, Politics, Art, Celebrities, Animals, Vehicles, Comics, Gadgets, Anime, Cartoons');

    
}
// Delete Message
