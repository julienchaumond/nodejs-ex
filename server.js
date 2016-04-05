//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var app     = express();
var eps     = require('ejs');
var ParseServer = require('parse-server').ParseServer;

app.engine('html', require('ejs').renderFile);

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var user = process.env.MONGODB_USER || 'userC5U'
var password = process.env.MONGODB_PASSWORD || 'YtI7w5uyE00una8G'
var database = process.env.MONGODB_DATABASE ||  'appsmonitor'
var adminpassword = process.env.MONGODB_ADMIN_PASSWORD || 'QrQnVy2cCjoVFXoj'

var mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;
var mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) 
{
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
  var mongoHost = process.env[mongoServiceName + "_SERVICE_HOST"];
  var mongoPort = process.env[mongoServiceName + "_SERVICE_PORT"];
  var mongoUser = process.env.MONGODB_USER

  if (mongoHost && mongoPort && process.env.MONGODB_DATABASE) 
  {
    mongoURLLabel = mongoURL = 'mongodb://';

    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) 
    {
      mongoURL += process.env.MONGODB_USER + ':' + process.env.MONGODB_PASSWORD + '@';
    }
    // Provide UI label that excludes user id and pw

    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + process.env.MONGODB_DATABASE;
    mongoURL += mongoHost + ':' + mongoPort + '/' + process.env.MONGODB_DATABASE;
  }
}
var db = null;
var dbDetails = new Object();

var initDb = function(callback) {
  console.log(mongoURL)
  if (mongoURL == null) return;

  var mongodb = require('mongodb');  
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      console.log(err)
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log("Connected to MongoDB at: " + mongoURL);
  });
};

app.get('/', function (req, res) {
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count +'}');
    });
  } else { 
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

var api = new ParseServer({
    databaseURI: mongoURL,
    appId: 'W4APPl4ENNM4u8ht1LXy9N9g8OHQFoeM8rQpZh2B',
    masterKey: 'mNsjphrPGWCIsFMUMYGA2TlaY7bjA3isuuxs0SmR',
    push: {
      ios: {
        pfx: 'certs/AppsMonitorAPNSAdHoc.p12',
        bundleId: 'com.orange.d4m.AppsMonitor',
        production: true
      }
    },
    serverURL: 'http://'+ip+':'+port+'/'
  });

// Serve the Parse API at /parse URL prefix
app.use('/parse', api);

app.listen(port, function() {
  console.log('parse-server running on port ' + port + '.');
});
