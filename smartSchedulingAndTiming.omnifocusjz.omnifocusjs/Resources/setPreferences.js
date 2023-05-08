(function () {
	//preferences = new Preferences() 

	let action = new PlugIn.Action(async function(selection, sender){
		try{
			const lib=this.libTimer
			await lib.configurePreferences()
		}catch(err){
			console.error(err)
			new Alert(err.name, err.message).show()	
		}	
	});
	
	action.validate = function(selection, sender){
		return true;
	};
	
	return action;
})()