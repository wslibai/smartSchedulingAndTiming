(function () {
	
	let action = new PlugIn.Action(async function(selection, sender){
		try{
			this.libTimer.validatePreferences("Action:sumTimeSpent")
					
			if (selection.projects && selection.projects.length > 0){
				for (let p of selection.projects){
					let sum=0
					let totalEstimatedMinutes=0
					for (let t of p.tasks){
						totalEstimatedMinutes += t.estimatedMinutes || 0
						sum +=await this.libTimer.sumTaskTimeSpent(t)
					}
					//保存项目总的预计时间
					p.task.estimatedMinutes=totalEstimatedMinutes				
					//将项目包含任务的花费时间汇总存入项目root task
					await this.libTimer.storeToTask(p.task, 
						this.libTimer.key('totalTimeSpentInMinutes'), sum)
					
					await this.libTimer.updateCompletedProgress(p.task,sum)
				}
			}else{
				for (let t of selection.tasks){
					await this.libTimer.sumTaskTimeSpent(t)
				}	
			}		
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}	
	});
	
	action.validate = function(selection, sender){
		return (selection.tasks && selection.tasks.length > 0) ||
			(selection.projects && selection.projects.length > 0);
	};
	
	return action;
})()