#!/usr/bin/env node

// Channel ID is on the the browser URL.: https://mycompany.slack.com/messages/MYCHANNELID/
// Pass it as a parameter: node ./delete-slack-messages.js CHANNEL_ID

// CONFIGURATION #######################################################################################################
const token = `xoxp-845229288001-840377524802-840747471394-e0c7fafb026db3b4070fa7aa4db493f2`; // You can learn it from: https://api.slack.com/custom-integrations/legacy-tokens 

// GLOBALS #############################################################################################################

let channel = 'CR34ZJRJ9';

// if (process.argv[0].indexOf('node') !== -1 && process.argv.length > 2) {
//     channel = process.argv[2];
// } else if (process.argv[0].indexOf('delete') !== -1 && process.argv.length > 1) {
//     channel = process.argv[1];
// } else {
//     console.log('Usage: node ./delete-slack-messages.js CHANNEL_ID');
//     process.exit(1);
// }

const https = require('https');
const express = require('express');
const app = express();
const shell = require('shelljs');
let baseApiUrl = 'https://slack.com/api/';
let messages = [];
let historyApiUrl = baseApiUrl + 'conversations.history?token=' + token + '&count=1000&channel=' + channel + '&cursor=';
let deleteApiUrl = baseApiUrl + 'chat.delete?token=' + token + '&channel=' + channel + '&ts='
let delay = 30; // Delay between delete operations in milliseconds
let nextCursor = '';

// ---------------------------------------------------------------------------------------------------------------------
function clear() {

    // if (message === '!delete') {
    //     deleteMessage();
    // }

    function deleteMessage() {

        if (messages.length == 0) {

            if (nextCursor) {
                processHistory();
            }

            return;
        }

        const ts = messages.shift();

        https.get(deleteApiUrl + ts, function (res) {

            let body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                const response = JSON.parse(body);
                let waitASecond = false;

                if (response.ok === true) {
                    console.log(ts + ' deleted!');

                } else if (response.ok === false) {
                    console.log(ts + ' could not be deleted! (' + response.error + ')');

                    if (response.error === 'ratelimited') {
                        waitASecond = true;
                        delay += 100; // If rate limited error caught then we need to increase delay.
                        messages.unshift(ts);
                    }
                }


                if (waitASecond) {
                    setTimeout(() => setTimeout(deleteMessage, delay), 1000);
                } else {
                    setTimeout(deleteMessage, delay);
                }
            });


        }).on('error', function (e) {
            console.error("Got an error: ", e);
        });
        return;
    }

    // ---------------------------------------------------------------------------------------------------------------------

    function processHistory() {

        https.get(historyApiUrl + nextCursor, function (res) {

            let body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {

                nextCursor = null;

                const response = JSON.parse(body);

                if (response.messages && response.messages.length > 0) {

                    if (response.has_more) {
                        nextCursor = response.response_metadata.next_cursor;
                    }

                    for (let i = 0; i < 20; i++) {
                        messages.push(response.messages[i].ts);
                    }

                    deleteMessage();

                }
            });
        }).on('error', function (e) {
            console.error("Got an error: ", e);
        });
        return;
    }

    // ---------------------------------------------------------------------------------------------------------------------

    if (token === 'SLACK TOKEN') {
        console.error('Token seems incorrect. Please open the file with an editor and modify the token variable.');
    } else {
        processHistory();
    }
    return;
}

module.exports = clear;