(function () {


	let action = new PlugIn.Action(async function(selection, sender){
		const lib=this.libTimer	
		try{
			let jobs=await lib.getJobs()
			if (jobs===null || jobs.length===0){
				let errMessage="无已分配番茄时钟时间数据需要清除，请先运行time arrangement动作为待处理任务安排时间。"
				throw new Error(errMessage)
			}else{
				let i=0
				console.log(`[cleanTomatoClock]清除前所有jobs记录：`)
				for (let t of jobs){
					let msg=`job`+lib.getRecordStr(i,t,`taskName`)
					console.log(msg)
					i++
				}
				
				lib.cleanJobTimeRecords(jobs)
				lib.clearTagFromAllTask("TimeQuantum|时间段")
				let message=`The tomato clock's data(jobs Array) are cleaned. `
				message+=`Now,you can do action "time arrangement" again.\n\n`
				message+=`番茄时钟的相关数据(jobs数组)已经清理完毕。可再次运行time arrangement动作。`
				console.log(message)
				new Alert(`清除番茄钟数据提醒`,message).show()
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