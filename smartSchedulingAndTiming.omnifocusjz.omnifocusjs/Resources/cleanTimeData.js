(function () {

	let action = new PlugIn.Action(async function(selection, sender){
		try {
			let title='confirm clean time tracking data'
			let message=`你确认要清除所选projects/tasks的时间跟踪数据吗？\n`
			message+=`共有：${selection.projects.length}个projects被选择。\n`
			message+=`共有：${selection.tasks.length}个tasks被选择。`
			const alert = new Alert(title,message)
			alert.addOption('Confirm')
			alert.addOption('Cancel')
			const alertPromise = alert.show()

			alertPromise.then(buttonIndex => {
				switch (buttonIndex) {
					case 0:
						this.libTimer.doClean(selection)
						break;
					case 1:
					 	console.log(`from cancelled.|您已选择取消了该次清除时间跟踪数据的操作。`)
					 	break;
				}
			}).catch((e)=>{new Alert(e.name, e.message).show()})
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