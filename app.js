const express = require('express');
const fs = require('fs');
const util = require('util');
const bodyParser = require('body-parser');
const mime = require('mime');

const contentManager = require('./content-manager.js');


//TODO: read from conf file
var htmldir = __dirname + "/html";
var contentdir = __dirname + "/content";
var defaulthtml = "index.html";
var rotatorcap = 30;
var listenPort = 3000;

mime.default_type = "text/html";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cm = contentManager(contentdir, rotatorcap);

var htmlserver = (req, res) => {
  console.log(req.path);
  var filepath = htmldir + (req.path === "/" ? "/index.html" : req.path);
  fs.readFile(filepath, (err, data) => {
    if(err) {
      console.error("Error while reading file: " + err.message);
      res.status(404).send("404 - Not found</br>" + err.message);
      return;
    }

    res.setHeader('Content-Type', mime.lookup(filepath));
    res.send(data);
  });
}

app.get("/", (req, res) => {
  res.redirect("/" + defaulthtml);
});

//tell express to listen to all files and folder in the htmldir
var htmldirContents = fs.readdirSync(htmldir);
for(var i = 0; i < htmldirContents.length; i++) {
  var listing = fs.statSync(htmldir + "/" + htmldirContents[i]);
  if(listing.isDirectory()) {
    console.log("INFO: htmlserver will now serve the directory " + htmldirContents[i]);
    app.get("/" + htmldirContents[i]  + "/*", htmlserver);
  } else if(listing.isFile()) {
    console.log("INFO: htmlserver will now serve the file " + htmldirContents[i]);
    app.get("/" + htmldirContents[i], htmlserver);
  } else {
    console.log("DEBUG: the listing " + htmldirContents  + " is not a directory or a file - htmlserver will NOT serve it");
  }
}

app.get('/contents/:section', cm.loadSection); 

app.post('/*', (req, res) => {
  res.setHeader('Content-Type', "text/plain");
  console.log("action: " + req.body.action);
  console.log("section: " + req.body.section);
  if(req.body.action === "edit_content") {
    cm.editContent(req, (err) => {
      if(err) {
        console.error("ERROR: " + err.message);
        res.status(500).send();
        return;
      }
      res.status(200).send();
    });
  } else {
    res.status(400).send();
    return;
  }
});

app.listen(listenPort);
