(function () {


	let action = new PlugIn.Action(async function(selection, sender){
		const lib=this.libTimer	
		try{
			let jobs=await lib.getJobs()
			if (jobs===null || jobs.length===0){
				lib.selectModeAndRunScheduling()
			}else{
				let i=0
				console.log(`[taskScheduling]当前所有jobs记录：`)
				for (let t of jobs){
					let msg=`job `+lib.getRecordStr(i,t,`taskName`)
					console.log(msg)
					i++
				}
				
				let unArrangementJobs=jobs.filter(j=>j.scheduleStatus===0)
				let message=``
				if (unArrangementJobs.length>0){//刚运行完动作taskScheduling后
					message+=`有任务未分配时间，请运行time arrangement动作为任务分配时间，并运行start tomato clock动作执行任务。\n`
				}
				
				let canArrangementJobs=jobs.filter(j=>(j.scheduleStatus===1 || j.scheduleStatus===2))
				if (canArrangementJobs.length>0){//尚未进行tomatoTiming的可重分配任务
					message+=`有任务分配过时间但未执行，请运行start tomato clock动作执行任务。\n`
				}
				
				let inDoingJobs=jobs.filter(j=>j.scheduleStatus===3)
				if (inDoingJobs.length>0){//正在执行中的任务
					message+="有任务处于执行中，未正常结束，该任务可能有部分执行时间数据未更新（可忽略）。"	
				}
				
				if (message!==``){
					if (app.platformName==="iOS"){
						message+=`是否要忽略以上问题，重新进行任务调度？`
						let alert = new Alert('重新进行任务调度确认？', message)
						alert.addOption('重调度')
						alert.addOption('不调度')
						const alertPromise = alert.show()
						alertPromise.then(buttonIndex => {
							switch (buttonIndex) {
								case 0:
									lib.selectModeAndRunScheduling()
									break
							}
						})
					}else{//macOS不支持上述方式
						message+=`或者在输出jobs数据(output task scheduling data)并核实确认后(可选)，运行clean scheduling task动作清除数据，再重新进行任务调度。`
						new Alert('任务调度状态提醒', message).show()
					}
				}else{
					lib.selectModeAndRunScheduling()	
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