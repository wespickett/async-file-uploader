import 'bootstrap';
import 'bootstrap/css/bootstrap.css!';
import {inject, ObserverLocator} from 'aurelia-framework';
import {HttpClient} from 'aurelia-http-client';
import 'npm:delivery@0.0.3/lib/client/delivery'
import io from 'socket.io-client';

console.log('Delivery');
console.log(Delivery, window.Delivery, io);


function getFileName(path) {
    var pathSections = path.split(/\/|\\/);
    var nameWithExtension = pathSections[pathSections.length - 1];

    var fileName = '';
    if (~nameWithExtension.indexOf('.')) {
        fileName = nameWithExtension.substr(0, nameWithExtension.lastIndexOf('.'));
    } else {
        fileName = nameWithExtension;
    }

    return fileName;
}

@inject(ObserverLocator)
export class App {

    displayName = '';
    userSelectedFile = void(0);
    projectLoaded = false;

    newFloorPlan = '';
    createFloorPlanMessages = [];
    floorPlansMap = new Map();
    loadingFloorPlanFiles = new Map();

    constructor(observerLocator) {
        this.observerLocator = observerLocator;
    }

    attached() {
        this.observerLocator.getObserver(this.floorPlanFile, 'value')
                            .subscribe(this.floorPlanFileValueChanged.bind(this));


        var socket = io.connect('http://0.0.0.0:5001');
        var delivery;
            
          socket.on('connect', () => {
            console.log('socket connect');
            delivery = new Delivery(socket);

            delivery.on('delivery.connect', delivery => {
                console.log('delivery.connect');

                $("#send").click( evt => {
                    console.log('this', this);

                    this.createFloorPlanMessages.push('Creating new floor plan [' + this.displayName + '] ...');

                    this.userSelectedFile = $(this.floorPlanFile)[0].files[0];
                    var fileName = this.userSelectedFile.name;
                    var displayName = this.displayName;

                    $(this.floorPlanFile).val('');
                    this.displayName = '';

                    socket.emit('event', {
                        eventType: 'createFloorPlan',
                        data: {
                            displayName: displayName,
                            fileName: fileName
                        }
                    });

                    evt.preventDefault();
                });

                $("#loadProject").click(evt => {
                    var projectName = $(this.projectName).val();
                    console.log('projectName', projectName);

                    this.floorPlansMap.clear();
                    this.createFloorPlanMessages = [];

                    socket.emit('event', {
                        eventType: 'loadProject',
                        data: {
                            projectName: projectName
                        }
                    });
                });

            });
         
            delivery.on('send.success', fileUID => {
                console.log("file was successfully sent.", fileUID);
                this.createFloorPlanMessages.push('File [' + fileUID.name + '] successfully uploaded.');
                this.createFloorPlanMessages.push('Generating thumbnails for [' + fileUID.name + ']...');

                var floorPlanIdForFile = this.loadingFloorPlanFiles.get(fileUID.uid);
                this.loadingFloorPlanFiles.delete(fileUID.uid);

                console.log('floorPlanIdForFile', this.loadingFloorPlanFiles, floorPlanIdForFile, fileUID.name, fileUID.uid);
              
                socket.emit('event', {
                    eventType: 'generateThumbnails',
                    data: {
                        floorPlanId: floorPlanIdForFile,
                        fileName: fileUID.name
                    }
                });
            });
        });

        socket.on('event', data => {
            console.log('event', data);
            var dataObj = data.data;

            switch(data.eventType) {
                case 'projectLoaded':
                    this.projectLoaded = true;
                    break;
                case 'thumbnailsGenerated':
                    //add files and thumbnail file urls to floorPlan
                    this.createFloorPlanMessages.push('Thumbnails generated.');
                    this.floorPlansMap.get(dataObj.floorPlanId).files = dataObj.files;
                    break;
                case 'floorPlanCreated':
                    console.log(dataObj, data);

                    this.floorPlansMap.set(dataObj.floorPlanId, dataObj);

                    var file = this.userSelectedFile;
                    console.log('file', this.file);

                    if (file) {
                        this.createFloorPlanMessages.push('Floor plan [' + dataObj.displayName + '] created.');
                        
                        this.createFloorPlanMessages.push('Uploading file [' + file.name + '] to server...');

                        var loadingFileUID = delivery.send(file);
                        console.log('loadingFileUID', loadingFileUID, dataObj.floorPlanId);

                        this.loadingFloorPlanFiles.set(loadingFileUID, dataObj.floorPlanId);

                        this.userSelectedFile = void(0);
                    }
                    break;
            }
        });
    }

    floorPlanFileValueChanged(newValue) {
        console.log('floorPlanFileValueChanged', newValue);

        var fileName = getFileName(newValue);
        this.displayName = this.displayName !== '' ? this.displayName : fileName;
    }
}