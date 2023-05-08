(function () {
	
	let action = new PlugIn.Action(async function(selection, sender){
		try{
			const lib=this.libTimer
			lib.validatePreferences("Action:stopTomatoClock")
	
   			let task=Task.byIdentifier(tomatoTracker.taskId)
			let now=new Date()
			console.log(`tomato: [${tomatoTracker.jobType}]/${tomatoTracker.project}/${task.name} , Abort by "Action:stopTomatoClock" at:${now}`)
			await lib.tomatoEndUpdateProcess(task,tomatoTracker.taskName,"stopTomatoClock")
			generatorTomatoJobObj.return("Action:stopTomatoClock中止了当前tomato clock。")
			lib.saveAvailableTomatoJobsToTomatoJobs()
			tomatoTracker.timer.cancel()
			tomatoTracker.timer = null
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}						
	});
	
	action.validate = function (selection, sender) {
        return (tomatoTracker && tomatoTracker.timer)
    };

	return action;
})()