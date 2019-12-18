const SlackBot = require('slackbots');
const axios = require('axios');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const clear = require('./delete-slack-messages');
const shell = require('shelljs');

dotenv.config();

var PORT = process.env.PORT || 3000;

app.get('/', (request, response) => {
    response.send('Testing 1998');
});

app.listen(PORT, () => {
    console.log('Server started on port 3000...');
});

app.use(express.urlencoded({ extended: true }))

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
    var message = message.split(' ');

    switch (message[0]) {
        case '!yomama':
            yoMamaJoke();
            break;
        case '!ping':
            bot.postMessageToChannel('general', 'pong!');
            break;
        case '!trivia2':
            triviaGameAny();
            break;
        case '!trivia':
            bot.postMessageToChannel('general', 'Please choose a category: \nGeneral Knowledge[9], Books[10], Film[11], Music[12], Musicals[13], Television[14], Video Games[15], Board Games[16], Science & Nature[17], Science: Computers[18], Science: Mathematics[19], Mythology[20], Sports[21], Geography[22], History[23], Politics[24], Art[25], Celebrities[26], Animals[27], Vehicles[28], Comics[29], Gadgets[30], Anime[31], Cartoons[32] \nType !c [#]');
            break;
        case '!c':
            message.shift()
            axios.get('https://opentdb.com/api.php?amount=2&category=' + message).then(response => {

                let questionNumber = 1;
                let questionIndex = 0;
                let points = 0;

                renderQuestion();

                function renderQuestion() {
                    if (questionIndex < response.data.results.length) {
                        let answers = [
                            response.data.results[questionIndex].correct_answer,
                            response.data.results[questionIndex].incorrect_answers[0],
                            response.data.results[questionIndex].incorrect_answers[1],
                            response.data.results[questionIndex].incorrect_answers[2],
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

                        let triviaQuestion = [
                            `Question ${questionNumber}: ` + response.data.results[questionIndex].question,
                            'Choices: ' + shuffledAnswers
                        ].join('\n\n');

                        bot.postMessageToChannel('general', `${triviaQuestion}`)


                        console.log(response.data.results[questionIndex].correct_answer);
                        console.log(message)
                        bot.on('message', data => {
                            if (data.type !== 'message') {
                                return;
                            }

                            handleTrivia(data.text);
                        });

                        function handleTrivia(userInput) {

                            if (userInput.toUpperCase() === response.data.results[questionIndex].correct_answer.toUpperCase()) {
                                console.log('hi')
                                points++;
                                questionIndex++;
                                questionNumber++;

                                renderQuestion();
                            } else if (userInput.toUpperCase() === response.data.results[questionIndex].incorrect_answers[0].toUpperCase() || userInput === response.data.results[questionIndex].incorrect_answers[1].toUpperCase() || userInput === response.data.results[questionIndex].incorrect_answers[2].toUpperCase()) {
                                bot.postMessageToChannel('general', `Incorrect! It was ${response.data.results[questionIndex].correct_answer}`);
                                questionIndex++;
                                questionNumber++;
                                renderQuestion();
                            }
                        }
                    } else {
                        bot.postMessageToChannel('general', `Score: ${points}/${questionIndex}`)
                        points = 0;
                        questionIndex = 0;
                        questionNumber = 1;
                        for (var i = 0; i < 5; i++) {
                            bot.removeAllListeners('message', handleTrivia);
                        }
                        bot.on('message', data => {
                            if (data.type !== 'message') {
                                return;
                            }

                            handleMessage(data.text);
                        });
                    }
                }
            })
            break;
        case '!t':

        case '!delete':
            clear.clear();
            break;
        case '!r':
            app.listen(8000);
            break;
        case '!help':
            bot.postMessageToChannel('general', 'Commands List: \n!yomama \n!ping \n!trivia \n!trivia2 (currently in development) \n!giphy [input]');
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


