(function () {
	let action = new PlugIn.Action(async function(selection, sender){

		try {
			const lib=this.libTimer
			let tomatoJobs=lib.getTomatoJobs()
			if (tomatoJobs===null || tomatoJobs.length===0){
				let errMessage="无tomatoJobs任务可供输出，请先从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling和time arrangement动作。"	
				throw new Error(errMessage)
			}else{
				let i=0
				console.log(`[outputTomatoClockData]当前所有tomatoJobs记录：`)
				for (let t of tomatoJobs){
					let message=`tomatoJob `+lib.getRecordStr(i,t,`taskName`)			
					console.log(message)
					i++
				}
				lib.selectModeAndRunOutputTimeData(tomatoJobs)
			}			
		}
		catch(err){
			new Alert(err.name, err.message).show()
		}		
	})
	
	action.validate = function(selection, sender){
		return true
	}
	
	return action
})()