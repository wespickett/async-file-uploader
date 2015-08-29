(function(){

    var gm = require('gm'),
        im = require('imagemagick'),

        //TODO: make into setting
        FLOORPLAN_FILES_PATH = 'floorPlanFiles/',
        THUMBNAIL_PATH = FLOORPLAN_FILES_PATH + 'thumbnails/';

    function init() {
        pipeLineEventChannel = pipeLineEvents;
        clientSocket = socket;

        pipeLineEvents.on('fileReceive.done', function(data) {
            var filePath = data.filePath;
            console.log('generating thumbnails for ' + filePath);

            setTimeout(pipeLineEvents.emit('generateThumbnails.done'), 700);
        });
    }

    function generateThumbnailsForFile(fileObj, cb) {
        console.log('filePath: ' + fileObj.url);
        var filePath = FLOORPLAN_FILES_PATH + fileObj.url;
        var thumbnailPath = THUMBNAIL_PATH + fileObj.url;


        im.resize({
          srcPath: filePath,
          dstPath: thumbnailPath,
          quality: 0.8,
          format: 'png',
          width: 100,
          height: 100
        }, function(err){
          if (err) throw err;
            console.log('generated thumbnail100');
            cb({
                thumbnail100: 'thumbnails/' + fileObj.url
            });
        });
    }

    var publicReturn = {
        generateThumbnailsForFile: generateThumbnailsForFile
    };
    
    module.exports = function(){
        return publicReturn;
    };
    
})();