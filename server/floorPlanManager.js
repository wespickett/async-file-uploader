(function(){

    var idCount = 0,
        floorPlanMap = {};

    function FloorPlan(initObj) {
        this.displayName = initObj.displayName;
        this.floorPlanId = ++idCount;

        //TODO: this is a quick solution, needs to be more robust
        this.files = [];
    }

    FloorPlan.prototype.addFile = function(filePath) {
        return this.files.push({
            url: filePath
        }) - 1;
    };

    FloorPlan.prototype.getFile = function(fileIndex) {
        return this.files[fileIndex];
    };

    FloorPlan.prototype.setThumbnails = function(fileIndex, thumbnailsObj) {
        var fileObj = this.files[fileIndex];
        for (var i in thumbnailsObj) {
            fileObj[i] = thumbnailsObj[i];
        }
        console.log('setThumbnails');
        console.log(this.files[fileIndex], thumbnailsObj);
        return this.files;
    };

    FloorPlan.prototype.toJSON = function() {
        return {
            displayName: this.displayName,
            floorPlanId: this.floorPlanId
        };
    };

    createNewFloorPlan = function(displayName) {
        var newFloorPlanInit = {
            displayName: displayName
        };
        console.log('newFloorPlanInit', newFloorPlanInit);
        var floorplan = new FloorPlan(newFloorPlanInit);
        floorPlanMap[floorplan.floorPlanId] = floorplan;

        return floorplan;
    };

    addFile = function(floorPlanId, filePath) {
        return floorPlanMap[floorPlanId].addFile(filePath);
    };

    getFile = function(floorPlanId, fileIndex) {
        return floorPlanMap[floorPlanId].getFile(fileIndex);
    };

    setThumbnails = function(floorPlanId, fileIndex, thumbnailsObj) {
        return floorPlanMap[floorPlanId].setThumbnails(fileIndex, thumbnailsObj);
    };

    var publicReturn = {
        createNewFloorPlan: createNewFloorPlan,
        addFile: addFile,
        getFile: getFile,
        setThumbnails: setThumbnails
    };
    
    module.exports = function(){
        return publicReturn;
    };
    
})();