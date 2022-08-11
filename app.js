const http = require('http');
const hostname = '127.0.0.1';
const axios = require('axios')
const port = 3000;
const dotenv = require("dotenv")

dotenv.config()

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hola Mundo');
});

server.listen(port, hostname, async () => {
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
    console.log(res)
    for (const channel of res.data.channels) {
        if (channel.is_im) {
           currentDMs[channel.id] = channel 
        }
    }

    console.log(currentDMs)
     // For each message, get the ts and add the the currentDMs
    const channel = 'D02774FFU6P'

    const conversationsHistoriesRes = await axios({
         url: `https://slack.com/api/conversations.history?channel=${channel}`,
        json: true,
        headers: {
            Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
    })
       const mostRecentMessage = currentDMs[channel]['ts'] = conversationsHistoriesRes.data.messages[0];
    console.log(currentDMs[channel])

    return
     const conversationsrepssRes = await axios({
            url: `https://slack.com/api/conversations.replies?channel=${channel}`,
            json: true,
            headers: {
                Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
                'Content-type': 'application/json'
            }
        })
        axios.get(`https://slack.com/api/converisations.replies?channel=${channel}&ts=${currentDMs[channel]['ts']}`,{
        headers: {
            Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
        }).then(res => {
            console.log('fetched data', res.data.response_metadata.messages)
        })


    // Then, for each message, call conversations.replies and check the res.messages.unread_count
});
