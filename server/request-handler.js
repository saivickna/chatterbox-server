var url = require('url');
var fs = require('fs');
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};
var messages = {results: []};
var messageID = 0;

var requestHandler = function(request, response) {
  const statusCode = (!request.url.includes('/classes/messages')) ? 404 : request.method === 'GET' ? 200 : 201;
  const order = url.parse(request.url, true).query['order'];
  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = 'text/plain';
  response.writeHead(statusCode, headers);

  var responseData = '';
  if (statusCode !== 404) {
    fs.readFile('./server/messages', (err, data) => { messages = err ? {results: []} : JSON.parse(data); });
    messageID = Math.max.apply(null, (messages.results.map(function(a) { return a.objectId; })));
  }
  if (statusCode === 201) {
    request.on('data', message => { messages.results.push(Object.assign(JSON.parse(message), {createdAt: new Date(), updatedAt: new Date(), objectId: (++messageID)}));});
    fs.writeFileSync('./server/messages', JSON.stringify(messages));
  } else if (statusCode === 200) {
    if (order) {
      var arr = (order[0] === '-') ? [-1, order.substring(1)] : [1, order];
      messages.results.sort((a, b) => { return ((a[arr[1]] < b[arr[1]]) ? -1 * arr[0] : (a[arr[1]] > b[arr[1]]) ? 1 * arr[0] : 0);});
    }
    responseData = JSON.stringify(messages);
  }
  response.end(responseData);
};

module.exports = requestHandler;
module.exports.requestHandler = requestHandler;



