const fs = require('fs');

var contentdir, rotatorcap;

module.exports = (_contentdir, _rotatorcap) => {
  contentdir = _contentdir;
  rotatorcap = _rotatorcap;
  return {
    editContent: editContent,
    loadSection: loadSection
  }
}

var loadSection = (req, res) => {
  var section = req.params.section;

  console.log("DEBUG: content-manager: section to be loaded is " + section);
  if(section === undefined) {
    console.log("ERROR: content-manager: recieved a request to load content without a section name");
    res.status(400).send();
    return;
  }

  var rotationdir = contentdir + "/" + section;
  fs.readdir(rotationdir, (err, files) => {
    if(err) {
      //check if the error says that the section was not found or something else
      if(err.message.indexOf("ENOENT") > -1) {
        console.error("ERROR: content-manager: section directory not found");
        res.status(404).send();
        return;
      }
      console.error("ERROR: content-manager: while loading section directory '" + section  + "'. " + err.message);
      res.status(500).send();
      return;
    }
    var newest = files[0];
    for(var i = 1; i < files.length; i++) {
      if( fs.statSync(rotationdir + "/" + files[i]).birthtime.getTime() >
          fs.statSync(rotationdir + "/" + newest).birthtime.getTime()) {
        newest = files[i];
      }
    }
    fs.readFile(rotationdir + "/" + newest, (err, data) => {
      if(err) {
        console.error("ERROR: content-manager: while trying to server newest file of section " + section);
        res.status(500).send();
        return;
      }

      console.log("INFO: content-manager: serving file '" + newest  + "' from section '" + section  + "'");
      res.setHeader('Content-Type', "text/html");
      res.status(200).send(data);
    });
  });
}

var editContent = (req, callback) => {
  //check in content directory if a directory in the name of section exists
  var sectiondir = contentdir + "/" + req.body.section;
  console.log("DEBUG: sectiondir is '" + sectiondir + "'");
  fs.stat(sectiondir, (err, stats) => {
    if(err) {
      console.error("ERROR: fs.stats error is " + err.message);
      if(err.message.indexOf("ENOENT") > -1) {
      //if it doesn't create it
        fs.mkdir(sectiondir, "0o755", (err) => {
          if(err) {
            var error = new Error("ERROR: While trying to create section dir '" + sectiondir  + "'. " + err.message);
            console.error(error.message);
            callback(error);
            return;
          }
          saveInRotation(sectiondir, req.body.content, callback);
        });
      } else {
        var error = new Error("ERROR: While looking for direcotry. " + err.message);
        console.error(error.message);
        callback(error);
        return;
      }
      return;
    }
    if(stats.isDirectory()) {
      console.log("DEBUG: " + sectiondir + " is a directory");
      saveInRotation(sectiondir, req.body.content, callback);
    } else {
      var error = new Error("ERROR: Listing '" + sectiondir  + "' exists but is not a direcotry");
      console.error(error.message);
      callback(error);
      return;
    }
  });
}

/**
* saves data into rotationdir deleting the oldest file if max files passed
*/
function saveInRotation(rotationdir, data, callback) {
  console.log("DEBUG: saveInRotation called with '" + rotationdir  + "' as rotationdir");
  //save req.body.content in a file named by the current unix time
  var fileName = Date.now() + ".html";
  fs.writeFile(rotationdir + "/" + fileName, data, "utf-8", (err) => {
    if(err) {
      var error = new Error("ERROR: while writing to a file in the rotator. " + err.message);
      console.error(error.message);
      callback(error);
      return;
    }
    console.log("INFO: file written successfuly to rotationdir " + rotationdir);
    removeExtra(rotationdir, callback);
  });
}

function CachedMetaList() {
  this.list = {};
}

CachedMetaList.prototype.getBirthTimeOf = function(rotationdir, name) {
  if(this.list[name] === undefined) {
    this.list[name] = new CachedMeta({
      rotationdir: rotationdir,
      name: name
    });
  }
  return this.list[name].getBirthTime();
}

function CachedMeta(data) {
  this.name = data.name;
  this.rotationdir = data.rotationdir;
  this.birthTime = data.birthTime;
}

CachedMeta.prototype.getBirthTime = function() {
  if (typeof this.birthTime === undefined) {
    this.birthTime = fs.statSync(this.rotationdir + "/" + this.name).birthTime.getTime();
    return this.birthTime;
  } else {
    return this.birthTime;
  }
}

/**
* removes the oldest file(s) that exceed the rotatorcap in the rotationdir
*/
function removeExtra(rotationdir, callback) {
    console.log("DEBUG: content-manager: removeExtra called");
  fs.readdir(rotationdir, (err, files) => {
    if(err) {
      console.error(err.message);
      callback(err);
      return;
    }
    console.log("DEBUG: There are " + files.length + " in the rotationdir");
    var loopDone = false;
    var deletionTasks = 0;
    while(files.length > rotatorcap) {
      //Delete oldest file
      var oldest = {
        index: 0,
        meta: new CachedMeta({
            rotationdir: rotationdir,
            name: files[0]
        })
      }
      var cachedMetaList = new CachedMetaList();
      for(var i = 1; i < files.length; i++) {
        if(cachedMetaList.getBirthTimeOf(rotationdir, files[i]) < oldest.meta.getBirthTime()) {
          oldest.meta = cachedMetaList.list[files[i]];
          oldest.index = i;
        }
      }
      console.log("INFO: removing oldest file named '" + oldest.meta.name  + "' from rotationdir " + rotationdir);
      deletionTasks++;
      fs.unlink(rotationdir + "/" + oldest.meta.name, (err) => {
        if(err) {
          var error = new Error("ERROR: while trying to remove file from rotator. " + err.message);
          console.error(error.message);
          callback(error);
          return;
        }
        deletionTasks--;
        if(loopDone && deletionTasks === 0)
          callback();
      });
      files.splice(oldest.index, 1);
    }
    loopDone = true;
    if(deletionTasks === 0)
      callback();
  });
}
