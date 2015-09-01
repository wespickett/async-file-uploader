(function(){

    var floorPlanMap = {},
        db;

    function Files() {
        this.types = 'main thumbnail100 thumbnail2000'.split(' ');
        this.files = {};
    }

    Files.prototype.hasType = function(type) {
        return !!~this.types.indexOf(type);
    };

    Files.prototype.setFile = function(id, type, path) {
        console.log('Files setFile:');
        console.log(this.hasType(type), id, type, path);
        if (this.hasType(type)) {
            this.files[type] = {
                id: id,
                path: path
            };
        }
    };

    Files.prototype.toJSON = function() {
        return {
            main: this.files.main ? this.files.main.path : '',
            thumbnail100: this.files.thumbnail100 ? this.files.thumbnail100.path : '',
            thumbnail2000: this.files.thumbnail2000 ? this.files.thumbnail2000.path : ''
        };
    };

    function FloorPlan(initObj) {
        this.displayName = initObj.displayName;
        this.floorPlanId = initObj.floorPlanId || void(0);
        this.files = new Files();
        this.files.setFile(null, 'main', initObj.fileName);
    }

    FloorPlan.prototype.setFile = function(fileInfo) {
        console.log('FloorPlan.setFile:');
        console.log(fileInfo);
        this.files.setFile(fileInfo.id, fileInfo.fileType, fileInfo.filePath);
        return true;
    };

    FloorPlan.prototype.getFiles = function() {
        return this.files;
    };

    FloorPlan.prototype.toJSON = function() {
        return {
            displayName: this.displayName,
            floorPlanId: this.floorPlanId,
            files: this.getFiles().toJSON()
        };
    };

    var createNewFloorPlan = function(newFloorPlanObj, cb) {
        console.log('newFloorPlanInit', newFloorPlanObj);

        var displayName = newFloorPlanObj.displayName;
        var newFloorPlan = new FloorPlan(newFloorPlanObj);

        db.query("INSERT into `floorPlan` (`displayName`) VALUES (?)", [displayName], function(err, result) {
            console.log('createNewFloorPlan result');
            console.log(result);
            newFloorPlan.floorPlanId = result.insertId
            floorPlanMap[newFloorPlan.floorPlanId] = newFloorPlan;

            cb(newFloorPlan.toJSON());
        });
    };

    var getFloorPlan = function(floorPlanId, cb) {
        console.log('getFloorPlan', floorPlanId, !!floorPlanMap[floorPlanId]);

        if (floorPlanMap[floorPlanId]) {
            cb(floorPlanMap[floorPlanId]);
        } else {
            db.query(
                "SELECT `displayName`, `fileId`, `fileType`, `filePath`"+
                " FROM `floorPlan`"+
                " JOIN `floorPlanFile` ON `floorPlan`.`id` = `floorPlanFile`.`floorPlanId`"+
                " JOIN `file` ON `floorPlanFile`.`fileId` = `file`.`id`"+
                " WHERE `floorPlan`.`id` = ?",
            [floorPlanId],
            function(err, result) {
                if (err) throw err;
                console.log('result');
                console.log(result, result.length);
                if (!result || !result.length) return;

                var displayName = result[0].displayName;
                var newFloorPlan = new FloorPlan({
                    displayName: displayName,
                    floorPlanId: floorPlanId
                });

                result.forEach(function(fileInfo) {
                    newFloorPlan.setFile({
                        id: fileInfo.fileId,
                        fileType: fileInfo.fileType.toLowerCase(),
                        filePath: fileInfo.filePath
                    });
                });

                floorPlanMap[newFloorPlan.floorPlanId] = newFloorPlan;
                cb(newFloorPlan.toJSON());
            });
        }
    };

    var setFiles = function(floorPlanId, fileObj, cb) {
        getFloorPlan(floorPlanId, function(floorPlan) {
            console.log('setFiles');
            console.log(fileObj);
            console.log(floorPlan.toJSON());
            var fileTypes = Object.keys(fileObj);
            fileTypes.forEach(function(fileType, i) {
                //TODO: performance boost by making into one query
                db.query("INSERT INTO `file` (`fileType`, `filePath`)"+
                    " VALUES (?, ?)"+
                    " ON DUPLICATE KEY UPDATE `fileType` = VALUES(`fileType`), `filePath` = VALUES(`filePath`);",
                    [fileType, fileObj[fileType]],
                    function (err, result) {
                        if (err) throw err;

                        console.log('INSERT INTO `file`:');
                        console.log(result, fileType, fileObj[fileType]);

                        db.query("INSERT INTO `floorPlanFile` (`floorPlanId`, `fileId`)"+
                            " VALUES(?, ?);",
                            [floorPlanId, result.insertId],
                            function(err, result) {
                                floorPlan.setFile({
                                    id: result.insertId,
                                    fileType: fileType,
                                    filePath: fileObj[fileType]
                                });

                                if (i === fileTypes.length - 1) {
                                    cb(floorPlan.getFiles().toJSON());
                                }
                            }
                        );
                    }
                );
                    
            });
        })
    };

    var getFiles = function(floorPlanId) {
        return floorPlanMap[floorPlanId].getFiles().toJSON();
    };

    var publicReturn = {
        createNewFloorPlan: createNewFloorPlan,
        setFiles: setFiles,
        getFiles: getFiles,
        getFloorPlan: getFloorPlan
    };
    
    module.exports = function(dbConnection){
        db = dbConnection;
        return publicReturn;
    };
    
})();