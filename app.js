const http = require('http');
const hostname = '127.0.0.1';
const axios = require('axios')
const port = 3000;
const dotenv = require("dotenv")
const player = require('play-sound')();
dotenv.config()

const importantUsers = [ 'U03THNFKX36' ]

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
});

const MAX_POLLS = 250

const poll = async (errorHandler, interval, timeout) => {
    let tries = 0
    player.play('./media/alert.m4r', (err) => {
        if (err) console.log(`Could not play sound: ${err}`);
    });
    let unreadWaitTime = 0
    const run = async () => {
        tries++
        console.log('Polling...')
        
        if (tries >= MAX_POLLS) {
            player.play('./media/error.m4r', (err) => {
                if (err) console.log(`Could not play sound: ${err}`);
            });
            const newCall = await delayPromise(interval);
            run()
        }

        let start = Date.now();
        let hasUnread = false
        const conversations = await getAllConversations();
        const unreadUsers = []
        for (const channel in conversations) {
            if (await unreadMessages(channel)) {
                hasUnread = true
                unreadUsers.push(conversations[channel].user)
                console.log(`You have an unread message from user ${conversations[channel].user} in channel ${channel}`)
            }
        }
        
        if (hasUnread) {
            // if this is the first time seeing this wait 24 mins
            if (unreadWaitTime == 0 && !importantUserMessage(unreadUsers)) await sleep()

            player.play('./media/alert.m4r', (err) => {
                if (err) console.log(`Could not play sound: ${err}`);
            });
            unreadWaitTime++
            const newCall = await delayPromise(interval);
            run()
        } else if (timeout !== 0 && Date.now() - start > timeout) {
            console.log('Call to slack timedout')
            player.play('./media/error.m4r', (err) => {
                if (err) console.log(`Could not play sound: ${err}`);
            });

           throw new Error('Call to Slack timedout') 
        } else {
            unreadWaitTime = 0
            const newCall = await delayPromise(interval);
            run()
        }
    }

    return run();
}

const importantUserMessage = (unreadUsers) => {
    return importantUsers.filter(n => unreadUsers.indexOf(n) !== -1).length > 0
}

const delayPromise = (ms) => {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep() {
    await timeout(30000);// set to 1440(24 mins)
    return null
}

const unreadMessages = async (channel) => {
     const res = await axios({
        method: 'get',
        url: `https://slack.com/api/conversations.info?channel=${channel}`,
        json: true,
        headers: {
            Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
    })
  
    console.log(`fetching unread_count for ${channel}`, res.data.channel.unread_count)
    return res.data.channel.unread_count > 0
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
    
    return currentDMs
}

server.listen(port, hostname, async () => {
    const interval = 10000
    const timeout = 30000
    poll((err) => console.log(err), interval, timeout)
});
