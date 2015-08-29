var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.Server(app),
    //querystring = require('querystring'),

    socketIOModule = require('socket.io'),
    //socketIO = socketIOModule(http),
    socketIO = socketIOModule.listen(5001),

    dl  = require('delivery'),
    fs  = require('fs'),

    events = require('events'),
    pipelineEmitter = new events.EventEmitter(),

    floorPlanManager = require('./floorPlanManager')(),
    thumbnailGenerator = require('./thumbnailGenerator')(),

    FLOORPLAN_FILES_PATH = 'floorPlanFiles/';


// chatManager = ChatManager(xmppClient);
// dbManager = DbManager(chatManager.handleMessage);
// permissionManager = PermissionManager(dbManager.handleMessage);
// listManager = ListManager(permissionManager.registerDelegate, dbManager.registerDelegate, connection);
// listController = ListController(permissionManager.registerDelegate, dbManager.registerDelegate, connection);
// userManager = UserManager(permissionManager.registerDelegate, dbManager.registerDelegate, connection);


console.log(floorPlanManager);
console.log(thumbnailGenerator);

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.use(express.static('../client'));
app.use(express.static('./' + FLOORPLAN_FILES_PATH));

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/index.html');
});

socketIO.sockets.on('connection', function(socket) {
    console.log('fileIO connection');
    var delivery = dl.listen(socket);

    socket.on('event', function(data) {
      console.log('event received');
      console.log(data);

        var dataObj = data.data;
        switch(data.eventType) {
            case 'createFloorPlan':
                var displayName = dataObj.displayName;

                var newFloorPlan = floorPlanManager.createNewFloorPlan(displayName);

                socket.emit('event', {
                    eventType: 'floorPlanCreated',
                    data: newFloorPlan
                });
                break;

            case 'generateThumbnails':
                var floorPlanId = dataObj.floorPlanId;
                var filePath = dataObj.fileName;

                //TODO: change file index to something more robust
                var fileIdx = floorPlanManager.addFile(floorPlanId, filePath);
                var fileObj = floorPlanManager.getFile(floorPlanId, fileIdx);

                console.log(fileObj)
                thumbnailGenerator.generateThumbnailsForFile(fileObj, function(generatedThumbnailsObj) {
                    console.log('generatedThumbnailsObj', generatedThumbnailsObj);
                    var updatedFiles = floorPlanManager.setThumbnails(floorPlanId, fileIdx, generatedThumbnailsObj);

                    socket.emit('event', {
                        eventType: 'thumbnailsGenerated',
                        data: {
                            floorPlanId: floorPlanId,
                            files: updatedFiles
                        }
                    });
                });
                break;
        }
    });

    delivery.on('receive.success',function(file){
        console.log('receive.success', file.name);

        var fileName = FLOORPLAN_FILES_PATH + file.name;

        //fileReceice.start
        fs.writeFile(fileName, file.buffer, function(err) {
            if (err) {
                console.log('File could not be saved.');
            } else {
                console.log('File saved.');
            };
        });

    });
});

server.on('connection', function(stream){
  console.log("server connected :)");
});

//app.set('view engine', 'ejs');


app.post('/floorPlan', function (req, res) {

  console.log(req);
  console.log(req.files);

  // //start the chain
  //pipelineEmitter.emit('init.done');

  // permissionManager.handleMessage(message, function(ret){
  //   var send = JSON.stringify(ret);
  //   console.log('send:', send);
  //   res.send(send);
  // }); 
});

server.listen(8888, function() {
    console.log('listening on localhost:8888');
});