(function () {


	

	let action = new PlugIn.Action(async function(selection, sender){

		try {
			const lib=this.libTimer
			let jobs=preferences.read("jobs")
			if (jobs===null || jobs.length===0){
				let errMessage="无jobs任务可供输出，请先从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作。"	
				throw new Error(errMessage)
			}else{
				let i=0
				console.log(`[outputTimeData]当前所有jobs记录：`)
				let message=``
				for (let t of jobs){
					let task=Task.byIdentifier(t.taskId)
					t.obj=task //恢复以JSON形式保存到preferences后丢失的对象引用
					t.parent=task.parent
					t.containingProject=task.containingProject
					t.tags=task.tags
					message=`job`+lib.getRecordStr(i,t,`taskName`)			
					console.log(message)	
					i++
				}
				lib.selectModeAndRunOutputTimeData(jobs)
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