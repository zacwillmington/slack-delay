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
    axios.get('https://slack.com/api/conversations.list', {
        headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'Content-type': 'application/json'
        }
    }).then(res => {
        console.log('fetched data', res)
    })
});
