const SlackBot = require('slackbots');
const axios = require('axios');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const clear = require('./delete-slack-messages');
const shell = require('shelljs');
const he = require('he');
var yoMamaJoke = require('./jokes')
dotenv.config();

var PORT = process.env.PORT || 3000;


const sum = require('./sum')


app.get('/', (request, response) => {
    response.send('Testing 1998');
    console.log(sum(5, 6))
});

app.listen(PORT, () => {
    console.log('Server started on port 3000...');
    console.log(sum(5, 6))
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
        case '!calculator':
            message.shift();

            let num1 = message[0]
            let num2 = message[2]

            if (message[1] === "+") {
                let answer = Number(num1) + Number(num2)
                bot.postMessageToChannel('general', `${answer}`)
            } else if (message[1] === "-") {
                let answer = Number(num1) - Number(num2)
                bot.postMessageToChannel('general', `${answer}`)
            } else if (message[1] === "*") {
                let answer = Number(num1) * Number(num2)
                bot.postMessageToChannel('general', `${answer}`)
            } else if (message[1] === "/") {
                let answer = Number(num1) / Number(num2)
                bot.postMessageToChannel('general', `${answer}`)
            }
            break;
        case '!trivia':
            axios.get('https://opentdb.com/api_category.php').then(response => {
                var categoriesArr = [];
                let categoryIndex = 0
                getCategories();
                function getCategories() {
                    if (categoryIndex < response.data.trivia_categories.length) {
                        var categoryId = [response.data.trivia_categories[categoryIndex].id];
                        var categoryName = [response.data.trivia_categories[categoryIndex].name];
                        var joinNameId = `[` + categoryId + `]` + categoryName
                        categoryIndex++;
                        categoriesArr.unshift(`${joinNameId}`);
                        getCategories();

                    } else {
                        var joinCategories = categoriesArr.join(' __ ');

                        bot.postMessageToChannel('general', he.unescape(`&#x60;Please choose a category:&#x60; \n\n&#x60;Type !category [#]&#x60; \n\n&#x60;${joinCategories}&#x60;`));
                    }
                }

            })
            break;
        case '!category':
            message.shift()
            axios.get('https://opentdb.com/api.php?amount=10&category=' + message).then(response => {

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

                        let shuffledAnswers = newArray.join(" | | ");

                        let triviaQuestion = [
                            `Question ${questionNumber}: ` + response.data.results[questionIndex].question,
                            'Choices: ' + shuffledAnswers
                        ].join('\n\n');

                        bot.postMessageToChannel('general', he.unescape(`${triviaQuestion}`))


                        console.log(he.unescape(`${response.data.results[questionIndex].correct_answer}`));
                        bot.on('message', data => {
                            if (data.type !== 'message') {
                                return;
                            }

                            handleTrivia(data.text);
                        });

                        function handleTrivia(userInput) {

                            let triviaInput = userInput.toLowerCase().trim();
                            let triviaCorrect = response.data.results[questionIndex].correct_answer.toLowerCase();

                            if (triviaInput === he.unescape(`${triviaCorrect}`)) {
                                bot.postMessageToChannel('general', `Correct!`)
                                points++;
                                questionIndex++;
                                questionNumber++;
                                answers = [];
                                bot.removeAllListeners('message', handleTrivia);

                                bot.on('message', data => {
                                    if (data.type !== 'message') {
                                        return;
                                    }

                                    handleMessage(data.text);
                                });

                                setTimeout(function () { renderQuestion() }, 2000);

                            } else if (triviaInput === '!skip') {
                                questionIndex++;
                                questionNumber++;
                                answers = [];
                                bot.removeAllListeners('message', handleTrivia);

                                bot.on('message', data => {
                                    if (data.type !== 'message') {
                                        return;
                                    }

                                    handleMessage(data.text);
                                });
                                setTimeout(function () { renderQuestion() }, 2000);
                            } else if (triviaInput === '!triviastop') {

                                bot.removeAllListeners('message', handleTrivia);

                                bot.on('message', data => {
                                    if (data.type !== 'message') {
                                        return;
                                    }

                                    handleMessage(data.text);
                                });

                                bot.postMessageToChannel('general', `Trivia Game Ended. \nScore: ${points}/${questionIndex}`)
                                points = 0;
                                questionIndex = 0;
                                questionNumber = 1;
                                answers = [];
                            } else if (triviaInput === response.data.results[questionIndex].incorrect_answers[0].toLowerCase() || triviaInput === response.data.results[questionIndex].incorrect_answers[1].toLowerCase() || triviaInput === response.data.results[questionIndex].incorrect_answers[2].toLowerCase()) {
                                bot.postMessageToChannel('general', `Incorrect! It was ${response.data.results[questionIndex].correct_answer}`);
                                questionIndex++;
                                questionNumber++;
                                answers = [];
                                bot.removeAllListeners('message', handleTrivia);

                                bot.on('message', data => {
                                    if (data.type !== 'message') {
                                        return;
                                    }

                                    handleMessage(data.text);
                                });
                                setTimeout(function () { renderQuestion() }, 2000);
                            }
                        }
                    } else {
                        bot.postMessageToChannel('general', `Trivia Game Ended. \nScore: ${points}/${questionIndex}`)
                        points = 0;
                        questionIndex = 0;
                        questionNumber = 1;
                        bot.removeAllListeners('message', handleTrivia);

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
            bot.postMessageToChannel('general', 'Commands List: \n!yomama \n!ping \n!trivia \n!skip (skip trivia question) \n!triviastop \n!giphy [input]');
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





