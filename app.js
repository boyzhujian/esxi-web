//dependencies
var http = require('http');
http.globalAgent.maxSockets = 15;

var express = require("express"),
    app = express(), //https://github.com/expressjs/cookie-session
    Connection = require('ssh2'); //https://github.com/mscdex/ssh2
    conn = new Connection();
//config
var config = require('./config.json');


app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  fs.readFile('./index.html',function (err, data){
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
        res.write(data);
        res.end(); 
    });
}); 

app.get('/server/list',  function(req,res){
  
  var servers = [],
      init = new Date().getTime();
 
  conn.on('ready', function() {
    conn.exec('vim-cmd vmsvc/getallvms', function(err, stream) {
      if (err)  {
        console.log(err);
        res.json({
          error: true,
          msg: err.msg,
          servers:[], 
          count: 0,
          time: (new Date().getTime() - init)
        });
        return;
      }
      stream.on('data', function(data) {
        var out = data.toString().split("\n");
        for (var i=1; i< out.length -1;i++){
          var o = out[i],
              server = {id: o.substring(0,7).trim(), 
                        name: o.substring(7,25).trim(),
                        file: o.substring(25,76).trim(), 
                        os: o.substring(76,92).trim(), 
                        version: o.substring(92,100).trim() , 
                        annotation: o.substring(100).trim()};
          //console.log(server);
          servers.push(server );
        }
        res.json({
          servers:servers, 
          count: servers.length,
          time: (new Date().getTime() - init)
        });
      });
    });
  }).connect({
    host: config.esxi.host,
    port: config.esxi.port,
    username: config.esxi.user,
    privateKey: require('fs').readFileSync(config.esxi.key)
  }); 
  
});

app.get('/server/status/:ids',  function(req,res){
  
  var ids = req.params.ids.split(","),
      init = new Date().getTime(),
      exec = "",
      runtime = "";
 
  console.log("Requesting server "+ids +" status");
  
  
  for (var i = 0; i< ids.length;i++){
    var id = ids[i];
    exec += 'echo "'+id+'";vim-cmd vmsvc/get.runtime '+id + " | grep powerState; ";
  }
  conn.on('ready', function() {
    //grep takes only what we want (overallstatus in this case), it would be better to use summary and parse it, but the data returned is not json
    conn.exec(exec, function(err, stream) {
      if (err)  {
        console.log(err);
        res.json({
          error: true,
          msg: err.msg,
          status: [],
          time: (new Date().getTime() - init)
        });
        return;
      }
      stream.on('end', function() {
        
        var lines = runtime.split("\n"),
            status = [];
        for (var i=0;i< lines.length-1;i=i+2){
          var server = {
              id: lines[i],
              status: lines[i+1].split('"')[1]
              };
          status.push(server);    
        }
        res.json({
          status:status, 
          time: (new Date().getTime() - init)
        });
      })
      stream.on('data', function(data) {
        runtime += data.toString();
      });
    });
  }).connect({
    host: config.esxi.host,
    port: config.esxi.port,
    username: config.esxi.user,
    privateKey: require('fs').readFileSync(config.esxi.key)
  }); 
  
});

app.get('/server/power/on/:id',  function(req,res){
  
  var id = req.params.id,
      init = new Date().getTime();
 
  console.log("Powering on server "+id);
  conn.on('ready', function() {
    conn.exec('vim-cmd vmsvc/power.on '+id, function(err, stream) {
      if (err)  {
        console.log(err);
        res.json({
          error: true,
          msg: err,
          time: (new Date().getTime() - init)
        });
        return;
      }
      stream.on('data', function(data) {
        res.json({
          response: data.toString(),
          time: (new Date().getTime() - init)
        });
      });
    });
  }).connect({
    host: config.esxi.host,
    port: config.esxi.port,
    username: config.esxi.user,
    privateKey: require('fs').readFileSync(config.esxi.key)
  }); 
  
});

app.get('/server/power/off/:id',  function(req,res){
  
  var id = req.params.id,
      init = new Date().getTime();
 
  console.log("Powering off server "+id);
  conn.on('ready', function() {
    conn.exec('vim-cmd vmsvc/power.off '+id, function(err, stream) {
      if (err)  {
        console.log(err);
        res.json({
          error: true,
          msg: err,
          time: (new Date().getTime() - init)
        });
        return;
      }
      stream.on('data', function(data) {
        res.json({
          response: data.toString(),
          time: (new Date().getTime() - init)
        });
      });
    });
  }).connect({
    host: config.esxi.host,
    port: config.esxi.port,
    username: config.esxi.user,
    privateKey: require('fs').readFileSync(config.esxi.key)
  }); 
  
});

//TODO BUild vim-cmd output to json and return the full response

//TODO Increase number of concurrent connections
app.listen(config.port);
console.log("Server started in http://localhost:"+config.port);