(function () {

	let action = new PlugIn.Action(async function(selection, sender){
		try {
			const lib=this.libTimer
			let jobs=await lib.getJobs()
			if (jobs===null || jobs.length===0){
				let errMessage="无待分配时间任务，请先从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作。"	
				throw new Error(errMessage)
			}
			
			let i=0
			console.log(`[timeArrangement]当前所有jobs记录：`)
			for (let t of jobs){
				let message=`job`+lib.getRecordStr(i,t,`taskName`)
				console.log(message)	
				i++
			}
			
			let msg=``
			let unArrangementJobs=jobs.filter(j=>j.scheduleStatus===0)
			if (unArrangementJobs.length>0){//刚运行完动作taskScheduling后
				lib.selectModeAndRunTimeArrangement(unArrangementJobs)
			}else{
				let canArrangementJobs=jobs.filter(j=>(j.scheduleStatus===1 || j.scheduleStatus===2))
				if (canArrangementJobs.length>0){//尚未进行tomatoTiming的可重分配任务
					msg=`有任务分配过时间但未执行，请运行start tomato clock动作执行任务。\n`
				}
				let inDoingJobs=jobs.filter(j=>j.scheduleStatus===3)
				if (inDoingJobs.length>0){//正在执行中的任务
					msg+="有任务处于执行中，未正常结束，该任务可能有部分执行时间数据未更新（可忽略）。\n"		
				}
				if (msg!==``){
					if (app.platformName==="iOS"){
						msg+=`\n是否要忽略以上问题，对任务重新进行时间分配？`
						let alert = new Alert('重新分配时间确认？', msg);
						alert.addOption('重分配');
						alert.addOption('不分配');
						const alertPromise = alert.show();
						alertPromise.then(buttonIndex => {
							switch (buttonIndex) {
								case 0:
									lib.cleanJobTimeRecords(jobs)
									lib.clearTagFromAllTask("TimeQuantum|时间段")
									lib.selectModeAndRunTimeArrangement(jobs)
									break
							}
						})
					}else{
						msg+=`或者在输出tomatoJobs数据(output tomato clock data)并核实确认后(可选)，运行clean tomato clock data动作清除数据，再重新进行时间安排。`
						new Alert('时间分配状态提醒',msg).show()
					}			
				}

				let doneJobs=jobs.filter(j=>j.scheduleStatus===4)
				if (doneJobs.length>0){//已完成任务
					let errMessage="现有调度任务已全部执行完毕，请先从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作。"	
					throw new Error(errMessage)	
				}
			}
		}catch(err){
			new Alert(err.name, err.message).show()
		}
	});
	
	action.validate = function(selection, sender){
		return (tomatoTracker && !tomatoTracker.timer)
	};
	
	return action;
})()