#!/usr/bin/node

var querystring = require('querystring'),
    fs          = require('fs');

require("http").createServer(function(request, response) {
  var body = '';
  
  if (request.method != "POST") {
    response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    response.end(''); 
  } else {
    request.setEncoding('utf8');
    request.on('data', function (data) {
      body = body + data;
    });

    request.on('end', function () {
      var clean_date    = (new Date).toISOString().replace(/:|Z|T/g,'\.').slice(0,-5),
          file_id       = request.url.slice(1),
          save_filename = './tmp/' + file_id + '_' + clean_date + '.json',
          data_filename = './js/designs/' + file_id + '.json',
          save_stream   = fs.createWriteStream( save_filename  ),
          data_stream   = fs.createWriteStream( data_filename ),
          output        = JSON.stringify( JSON.parse( body ), null, 2 );
      
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end();
            
      var writefile = function(s) {
        console.log('writing ' + s.path );
        s.write( output );
        s.destroy();
//        console.log('closed')
      }
      
      save_stream.once('open', function() { writefile( save_stream ) });
      data_stream.once('open', function() { writefile( data_stream ) });

      // console.log( output );
    });
  }
}).listen(6969);