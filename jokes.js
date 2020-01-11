function yoMamaJoke() {
    axios.get('http://api.yomomma.info').then(response => {
        const joke = response.data.joke;

        bot.postMessageToChannel('general', `${joke}`);
    });
};

module.exports = yoMamaJoke