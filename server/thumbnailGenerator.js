(function(){

    var gm = require('gm'),
        im = require('imagemagick'),

        //TODO: make into setting
        FLOORPLAN_FILES_PATH = 'floorPlanFiles/',
        THUMBNAIL_FILES_PATH = 'thumbnails/',
        THUMBNAIL_PATH = FLOORPLAN_FILES_PATH + THUMBNAIL_FILES_PATH;


    function generateThumbnailsForFile(filePath, cb) {

        im.resize({
          srcPath: FLOORPLAN_FILES_PATH + filePath,
          dstPath: THUMBNAIL_PATH + filePath,
          quality: 0.8,
          format: 'png',
          width: 100,
          height: 100
        }, function(err){
          if (err) throw err;
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