const Symphony = require('symphony-api-client-node');
const needle = require('needle');
const ejs = require('ejs');

Symphony.initBot(__dirname + '/config.json').then((symConfig) => {  
  const intervalSec = (process.argv[2] || symConfig.config.intervalSec || 60);
  console.log(`Notification Room set to '${symConfig.config.room}'`);
  console.log(`Notification interval set to ${intervalSec} seconds`);

  if(symConfig.config.debug) Symphony.setDebugMode(symConfig.config.debug);

  setInterval(() => {
    let url = symConfig.config.apiUrl;
    let options = [];
    needle('get', url, options).then(res => {
      let quote = res.body["Global Quote"];
      if (quote) {
        quote.symbol = quote["01. symbol"];
        quote.price = quote["05. price"];
        quote.prevClose = quote["08. previous close"];
        quote.change = quote["09. change"];
        quote.changePercent = quote["10. change percent"];

        let msg = ejs.render(symConfig.config.template, quote);
        
        Symphony.getUserStreams(0, 100, [{ "type": "ROOM" }], false).then(streams => {
          let stream = streams.find(stream => {
            return stream.roomAttributes.name == symConfig.config.room;
          });
          if (stream && stream.id) {
            Symphony.sendMessage(stream.id, msg, null, Symphony.MESSAGEML_FORMAT);
          } else {
            console.error(`Unable to find room '${symConfig.config.room}'`)
          }
        })

        prevPrice = quote.price;
      }

    }).catch(err => {
      console.error(err);
    });
  }, intervalSec*1000)

}).fail(err => {
  console.error('Error starting bot', err);
})