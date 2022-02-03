const functions = require('firebase-functions');


const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  organization: functions.config().//apikey
  apiKey: functions.config().//apikey 
});
const openai = new OpenAIApi(configuration);

const Alpaca = require('@alpacahq/alpaca-trade-api');
const alpaca = new Alpaca({
  keyId: functions.config().//apikey
  secretKey: functions.config().//apikey
  paper: true,
});

// Scrape data from twitter

const puppeteer = require('puppeteer');

async function scrape() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://twitter.com/MrZackMorris', {
    waitUntil: 'networkidle2',
  });

  await page.waitForTimeout(4000);

  const tweets = await page.evaluate(async () => {
    return document.body.innerText;
  });

  await browser.close();

  return tweets;
}

exports.helloWorld = functions.https.onRequest(async (request, response) => {
  response.send('test');
});


    const tweets = await scrape();

    const gptCompletion = await openai.createCompletion('text-davinci-001', {
      prompt: `${tweets} Stocks picked: `,
      temperature: 0.7,
      max_tokens: 32,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const stocksToBuy = gptCompletion.data.choices[0].text.match(/\b[A-Z]+\b/g);
    

    if (!stocksToBuy) {
      return null;
    }

    //Make trades using alpaca 

    // close all positions
    const cancel = await alpaca.cancelAllOrders();
    const liquidate = await alpaca.closeAllPositions();

    // get account
    const account = await alpaca.getAccount();
    console.log(`dry powder: ${account.buying_power}`);

    // place order
    const order = await alpaca.createOrder({
      symbol: stocksToBuy[0],
      qty: 1,
      notional: account.buying_power,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });

    console.log(`stocks i bought: ${order.id}`);

    return null;
  });