(function(){

    var floorPlanMap = {},
        db,
        activeProjectId = void(0);

    var loadProject = function(projectName, cb) {
        db.query(
                "SELECT `project`.`id` as projectId, GROUP_CONCAT(`floorPlan`.`id`) AS floorPlanIds"+
                " FROM `project`"+
                " LEFT JOIN `projectFloorPlan` ON `project`.`id` = `projectFloorPlan`.`projectId`"+
                " LEFT JOIN `floorPlan` ON `projectFloorPlan`.`floorPlanId` = `floorPlan`.`id`"+
                " WHERE `project`.`name` = ?"+
                " GROUP BY `project`.`name`;",
            [projectName],
            function(err, result) {

                if (!result || !result.length) {
                    db.query("INSERT INTO `project` (`name`) VALUES (?)", [projectName],
                        function(err, result) {
                            activeProjectId = result.insertId;
                            cb([]);
                        }
                    )
                } else {
                    var floorPlanIds = result[0].floorPlanIds && result[0].floorPlanIds.length ? result[0].floorPlanIds.split(',') : [];
                    activeProjectId = result[0].projectId; 
                    cb(floorPlanIds);
                }
            }
        );
    };

    var addFloorPlanToProject = function(floorPlanId, cb) {
        db.query("INSERT INTO `projectFloorPlan` (`projectId`, `floorPlanId`) VALUES(?, ?);",
            [activeProjectId, floorPlanId],
            function(err, result) {
                if (err) throw err;
                cb();
            }
        );
    };

    var publicReturn = {
        loadProject: loadProject,
        addFloorPlanToProject: addFloorPlanToProject
    };
    
    module.exports = function(dbConnection){
        db = dbConnection;
        return publicReturn;
    };
    
})();