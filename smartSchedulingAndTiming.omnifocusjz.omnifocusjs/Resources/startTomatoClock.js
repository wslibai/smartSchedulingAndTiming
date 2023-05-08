(function () {
	tomatoTracker = {
		timer: null,
		durationInSec: 0,
		taskId: null,
		taskName:"",
		project:"",
		sound: null
	}


	let action = new PlugIn.Action(async function(selection, sender){

		try {
			const lib=this.libTimer
			lib.validatePreferences("Action:startTomatoClock")
			let tomatoJobs=preferences.read("tomatoJobs")
			let i=0
			console.log(`[startTomatoClock]当前所有tomatoJobs记录：`)
			for (let t of tomatoJobs){
				let task=Task.byIdentifier(t.taskId)
				t.containingProject=task.containingProject
				let message=`tomatoJob`+lib.getRecordStr(i,t,`taskName`)			
				console.log(message)
				i++	
			}
			let message=`请先检视(review)您的未完成项目(project)，修改task的相关属性，添加相关Tag，`
			message+=`调整“Scheduling|调度”Tag视图中任务的Flaged、四象限Tag、预测视图的今日tag、Due、Defer等参数改变待执行任务列表，`
			message+=`再从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling和time arrangement动作，重新生成tomatoJobs。`
				
			if (tomatoJobs===null || tomatoJobs.length===0){
				let errMessage=`目前没有可运行的tomatoJobs。\n\n`+message
				console.log(errMessage)
				throw new Error(errMessage)
			}

			let uncompletedTomatoJobs=tomatoJobs.filter(t=>!t.runState)
			if (uncompletedTomatoJobs===null || uncompletedTomatoJobs.length===0){
				let errMessage=`您的所有tomatoJob均已完成。\n\n`+message
				console.log(errMessage)
				throw new Error(errMessage)
			}
			
			console.log(`[startTomatoClock] uncompleted tomatoJobs:`)
			i=0
			for (let t of uncompletedTomatoJobs){
				task=Task.byIdentifier(t.taskId)
				t.containingProject=task.containingProject
				let message=`tomato`+lib.getRecordStr(i,t,`taskName`)			
				console.log(message)
				i++
			}
			
			if (app.platformName==="iOS"){
				message=`您当前是在iOS上运行start tomato clock插件动作，因iOS平台目前不支持JS代码在后台运行，`
				message+=`一旦Omnifocus不在前台运行，该插件动作的代码将会异常终止，导致tomato clock计时功能无法正常运行。\n`
				message+=`请优先选择macOS平台运行此插件动作，请确认是否继续在此iOS平台运行？`
				let alert=new Alert(`请确认是否继续运行？`, message)
				alert.addOption('继续')
				alert.addOption('退出')
				const alertPromise = alert.show()

				alertPromise.then(buttonIndex => {
					switch (buttonIndex) {
						case 0:
							lib.selectModeAndRunTomatoTiming(uncompletedTomatoJobs)
							break
						case 1:
							console.log(`您选择退出了该插件动作start tomato clock的运行。`)
							break
					}
				});
			}else{
				lib.selectModeAndRunTomatoTiming(uncompletedTomatoJobs)
			}
		}catch(err){
			new Alert(err.name, err.message).show()
		}		
	})
	
	action.validate = function(selection, sender){
		return (tomatoTracker && !tomatoTracker.timer)
	}
	
	return action
})()