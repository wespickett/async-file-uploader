(function(){

    var gm = require('gm'),
        im = require('imagemagick'),

        //TODO: make into setting
        FLOORPLAN_FILES_PATH = 'floorPlanFiles/',
        THUMBNAIL_FILES_PATH = 'thumbnails/',
        THUMBNAIL_PATH = FLOORPLAN_FILES_PATH + THUMBNAIL_FILES_PATH;

    function init() {
        pipeLineEventChannel = pipeLineEvents;
        clientSocket = socket;

        pipeLineEvents.on('fileReceive.done', function(data) {
            var filePath = data.filePath;
            console.log('generating thumbnails for ' + filePath);

            setTimeout(pipeLineEvents.emit('generateThumbnails.done'), 700);
        });
    }

    function generateThumbnailsForFile(filePath, cb) {
        console.log('filePath: ' + filePath);

        im.resize({
          srcPath: FLOORPLAN_FILES_PATH + filePath,
          dstPath: THUMBNAIL_PATH + filePath,
          quality: 0.8,
          format: 'png',
          width: 100,
          height: 100
        }, function(err){
          if (err) throw err;
            console.log('generated thumbnail100');
            cb({
                thumbnail100: THUMBNAIL_FILES_PATH + filePath
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