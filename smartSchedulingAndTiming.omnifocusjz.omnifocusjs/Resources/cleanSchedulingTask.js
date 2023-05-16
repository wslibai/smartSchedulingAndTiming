(function () {


	let action = new PlugIn.Action(async function(selection, sender){
		const lib=this.libTimer	
		try{
			let jobs=await lib.getJobs()
			if (jobs===null || jobs.length===0){
				let errMessage="无已调度任务需要清除，请先运行task scheduling动作调度任务。"
				throw new Error(errMessage)
			}else{
				let i=0
				console.log(`[cleanSchedulingTask]当前所有jobs记录：`)
				for (let t of jobs){
					let msg=`job`+lib.getRecordStr(i,t,`taskName`)
					console.log(msg)
					i++
				}
				jobs=[]
				preferences.write(`jobs`,jobs)
				let message=`The scheduling task's data(jobs Array) are cleaned. `
				message+=`Now,you can do action "task scheduling" again.\n\n`
				message+=`调度任务的相关数据(jobs数组)已经清理完毕。可再次运行task scheduling动作。`
				console.log(message)
				new Alert(`清除任务调度数据提醒`,message).show()
			}
		}catch(err){
			new Alert(err.name, err.message).show()	
		}		
	});
	
	action.validate = function(selection, sender){
		return true
	};
	
	return action;
})()