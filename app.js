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

server.listen(port, hostname, () => {
    const currentDMs = {}
    // Check the current slack direct messages for new direct messages
    // Need to find a way to get the status of a direct message history
    axios.get('https://slack.com/api/conversations.list?types=im', {
        headers: {
            Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
    }).then(res => {
        console.log(res.data)
        for (const channel of res.data.channels) {
            if (channel.is_im) {
                currentDMs[channel.id] = channel 
            }
        }
        //console.log(currentDMs)
    })

    // channel id = D02774FFU6P
     axios.get('https://slack.com/api/conversations.replies?channel=D03TC8YDGN8', {
        headers: {
            Authorization: `Bearer ${process.env.USER_AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
    }).then(res => {
        console.log('fetched data', res.data.response_metadata.messages)
    })
    

    // Then, for each message, call conversations.replies and check the res.messages.unread_count
});
