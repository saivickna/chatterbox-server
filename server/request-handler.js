var url = require('url');
var fs = require('fs');
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};


var requestHandler = function(request, response) {
  const statusCode = (!request.url.includes('/classes/messages')) ? 404 : (request.method.toUpperCase() === 'GET' || request.method.toUpperCase() === 'OPTIONS') ? 200 : 201;
  const order = url.parse(request.url, true).query['order'];
  // See the note below about CORS headers.
  var messages = {results: []};
  var messageID = 0;

  var headers = defaultCorsHeaders;
  headers['Content-Type'] = 'text/plain';
  response.writeHead(statusCode, headers);

  if (statusCode !== 404) {
    fs.open('./server/messages', 'r+', (err, fd) => {
      fs.readFile('./server/messages', (err, data) => {
        messages = (err || (data.length === 0)) ? {results: []} : JSON.parse(data); 
        messageID = Math.max(Math.max.apply(null, (messages.results.map(function(a) { return (a.objectId || 0); }))), 0);
        if (statusCode === 201) {
          request.on('data', message => { 
            messages.results.push(Object.assign(JSON.parse(message), {createdAt: new Date(), updatedAt: new Date(), objectId: (++messageID)}));
            fs.writeFile('./server/messages', JSON.stringify(messages), (err) => { fs.close(fd, () => {response.end('');});});
          });
        } else if (statusCode === 200) {
          if (order) {
            var arr = (order[0] === '-') ? [-1, order.substring(1)] : [1, order];
            messages.results.sort((a, b) => { return ((a[arr[1]] < b[arr[1]]) ? -1 * arr[0] : (a[arr[1]] > b[arr[1]]) ? 1 * arr[0] : 0);});
          }
          fs.close(fd, () => {response.end(JSON.stringify(messages));});
        }
      });
    })
    
  } else {
    response.end('');
  }  
};

module.exports = requestHandler;
module.exports.requestHandler = requestHandler;



