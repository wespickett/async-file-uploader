var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.Server(app),
    mysql = require('mysql'),

    socketIOModule = require('socket.io'),
    socketIO = socketIOModule.listen(5001),

    dl  = require('delivery'),
    fs  = require('fs'),

    events = require('events'),
    pipelineEmitter = new events.EventEmitter(),

    floorPlanManagerModule = require('./floorPlanManager'),
    projectManagerModule = require('./projectManager'),
    thumbnailGenerator = require('./thumbnailGenerator')(),

    FLOORPLAN_FILES_PATH = 'floorPlanFiles/';

//connect mysql
var dbConnection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : 'password',
  database : 'fieldwire'
});
dbConnection.connect();


var floorPlanManager = floorPlanManagerModule(dbConnection);
var projectManager = projectManagerModule(dbConnection);


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
            case 'loadProject':
                var projectName = dataObj.projectName;
                projectManager.loadProject(projectName, function(floorPlanIds) {

                    socket.emit('event', {
                        eventType: 'projectLoaded',
                        projectName: projectName
                    });

                    floorPlanIds.forEach(function(floorPlanId) {
                        floorPlanManager.getFloorPlan(floorPlanId, function(loadedFloorPlan) {
                            socket.emit('event', {
                                eventType: 'floorPlanCreated',
                                data: loadedFloorPlan
                            });
                        });
                    });
                });
                break;
            case 'createFloorPlan':
                var createFloorPlanObj = {
                    displayName: dataObj.displayName,
                    fileName: dataObj.fileName
                };

                floorPlanManager.createNewFloorPlan(createFloorPlanObj, function(createdFloorPlan) {

                    projectManager.addFloorPlanToProject(createdFloorPlan.floorPlanId, function() {
                        socket.emit('event', {
                            eventType: 'floorPlanCreated',
                            data: createdFloorPlan
                        }); 
                    });
                });
                break;

            case 'generateThumbnails':
                var floorPlanId = dataObj.floorPlanId;
                var filePath = dataObj.fileName;

                thumbnailGenerator.generateThumbnailsForFile(filePath, function(generatedThumbnailsObj) {

                    var fileObj = generatedThumbnailsObj;
                    fileObj.main = filePath;

                    floorPlanManager.setFiles(floorPlanId, fileObj, function(updatedFiles) {

                        socket.emit('event', {
                        eventType: 'thumbnailsGenerated',
                            data: {
                                floorPlanId: floorPlanId,
                                files: updatedFiles
                            }
                        });
                    });
                });
                break;
        }
    });

    delivery.on('receive.success',function(file){

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


server.listen(8888, function() {
    console.log('listening on localhost:8888');
});