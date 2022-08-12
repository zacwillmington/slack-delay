const http = require('http');
const hostname = '127.0.0.1';
const axios = require('axios')
const port = 3000;
const dotenv = require("dotenv")
const player = require('play-sound')();
dotenv.config()

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hola Mundo');
});

const retries = 288

const channel = 'D02774FFU6P'
const getLastRead = async (channel) => {
     const conversationsHistoriesForChannel = await axios({
            url: `https://slack.com/api/conversations.history?channel=${channel}`,
            json: true,
            headers: {
                Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
                'Content-type': 'application/json'
            }
        })
    
    return conversationsHistoriesForChannel.data.messages[0].ts
}

const poll = async (errorHandler, interval, timeout) => {
    const conversations = await getAllConversations();

    player.play('./media/alert.m4r', (err) => {
        if (err) console.log(`Could not play sound: ${err}`);
    });

    const run = async () => {
        console.log('Polling...')
        let start = Date.now();

        const lastReadTime = await getLastRead(channel)
        console.log(`Fetched conversation history for channel: ${channel}`)

        console.log('History from last read', conversations[channel])
        console.log('Last read message time', lastReadTime)
        // If there is a new conversation then there must be a new message 
        // Or if there is a new message from a current conversation
        if (!(channel in conversations) || lastReadTime !== conversations[channel].ts) {
            
            player.play('./media/alert.m4r', (err) => {
                if (err) console.log(`Could not play sound: ${err}`);
            });

            console.log(`Last read time of conversation: ${lastReadTime}, previous read time ${conversations[channel].ts}`)
            const newCall = await delayPromise(interval);
            run()
        } else if (timeout !== 0 && Date.now() - start > timeout) {
            // Error should be thrown and alerted
           throw new Error('Call to Slack timedout') 
        } else {
            // repoll
            console.log('No new messages')
            const newCall = await delayPromise(interval);
            run()
        }
        

    //return getAllConversations().then(function({ data }) {
    //  console.log('data:', data);
    //  if (predicate(data)) {
    //    // we know we're done here, return from here whatever you
    //    // want the final resolved value of the promise to be
    //    return data;
    //  } else {
    //    if (timeout !== 0 && Date.now() - start > timeout) {
    //      errorHandler();
    //    } else {
    //      // run again with a short delay
    //      return delayPromise(interval).then(run);
    //    }
    //  }
    //});
    }
    return run();
}

const delayPromise = (ms) => {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

const getAllConversations = async () => {
     const currentDMs = {}
    // Check the current slack direct messages for new direct messages
    // Need to find a way to get the status of a direct message history
    const res = await axios({
        method: 'get',
        url: 'https://slack.com/api/conversations.list?types=im',
        json: true,
        headers: {
            Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
    })
    for (const channel of res.data.channels) {
        if (channel.is_im) {
           currentDMs[channel.id] = channel 
        }
    }
    
    currentDMs[channel]['ts'] = await getLastRead(channel)
    return currentDMs
}

server.listen(port, hostname, async () => {
    const interval = 10000
    const timeout = 30000
    poll((err) => console.log(err), interval, timeout)
   // const currentDMs = {}
   // // Check the current slack direct messages for new direct messages
   // // Need to find a way to get the status of a direct message history
   // 
   // const res = await axios({
   //     method: 'get',
   //     url: 'https://slack.com/api/conversations.list?types=im',
   //     json: true,
   //     headers: {
   //         Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
   //         'Content-type': 'application/json'
   //     }
   // })
   // console.log(res)
   // for (const channel of res.data.channels) {
   //     if (channel.is_im) {
   //        currentDMs[channel.id] = channel 
   //     }
   // }


   // /*
   //     *
   //     *
   //     * converstionLastRead = {
   //     *   channelId: tsId
   //     *}
   //     * */
   //  // For each message, get the ts and add the the currentDMs
   // const channel = 'D02774FFU6P'

   // const conversationsHistoriesRes = await axios({
   //      url: `https://slack.com/api/conversations.history?channel=${channel}`,
   //     json: true,
   //     headers: {
   //         Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
   //         'Content-type': 'application/json'
   //     }
   // })
   //    const mostRecentMessage = currentDMs[channel]['ts'] = conversationsHistoriesRes.data.messages[0];
   //     if (!(lastRead in converstaionLastRead)) {
   //         // Make alert saying that new message.
   //         // if the message is unread

   //     }

   // return
   //  const conversationsrepssRes = await axios({
   //         url: `https://slack.com/api/conversations.replies?channel=${channel}`,
   //         json: true,
   //         headers: {
   //             Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
   //             'Content-type': 'application/json'
   //         }
   //     })
   //     axios.get(`https://slack.com/api/converisations.replies?channel=${channel}&ts=${currentDMs[channel]['ts']}`,{
   //     headers: {
   //         Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
   //         'Content-type': 'application/json'
   //     }
   //     }).then(res => {
   //         console.log('fetched data', res.data.response_metadata.messages)
   //     })


    // Then, for each message, call conversations.replies and check the res.messages.unread_count
});
