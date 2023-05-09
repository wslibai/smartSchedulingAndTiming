(function () {
	patternTomato=new RegExp("(\\[tomato:)(\\d+\\.*\\d*|NaN)(\\])","gi")		
	patternTimeSpent=new RegExp("(\\[timeSpent:)(\\d+\\.*\\d*|NaN)(m\\])","gi")	
	patternPercent=new RegExp("(\\[percent:)(\\d+\\.*\\d*|NaN)(%\\])","gi")
	tomatoRestPattern=new RegExp("^(\\[tomatoRest\\()(\\d{1,2})(m\\)\\])")
	
	timeQuantumStrPattern=new RegExp("^([0-1][0-9]|[2][0-3]):([0-5][0-9])-([0-1][0-9]|[2][0-3]):([0-5][0-9])$")
	StartSchedulingForTomorrowPattern=new RegExp("^([2][0-3]):([0-5][0-9])$")
	
	//preferences = new Preferences() 
	
	preferencesValues=new Array()

	let libTimer = new PlugIn.Library(new Version("1.0"));

	
  	const DB_NAME = 'db.json'


	libTimer.loadSyncedPrefs = () => {
		const syncedPrefsPlugin = PlugIn.find('com.KaitlinSalzke.SyncedPrefLibrary')

		if (syncedPrefsPlugin !== null) {
		  const SyncedPref = syncedPrefsPlugin.library('syncedPrefLibrary').SyncedPref
		  return new SyncedPref('com.Macrosoft.of-smartSchedulingAndTiming')
		} else {
		  const alert = new Alert(
			'Synced Preferences Library Required',
			'For the Smart Scheduling and Timing plug-in to work correctly, the \'Synced Preferences for OmniFocus\' plug-in (https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plug-in installed, or it is not installed correctly.'
		  )
		  alert.show()
		}
	}

	preferences = libTimer.loadSyncedPrefs()
	
	
	libTimer.performPlugInAction=function(pluginID, actionName){
		var plugin = PlugIn.find(pluginID)
		if (plugin === null){throw new Error("Plug-in not installed.")}
		var actionNames = plugin.actions.map(action => action.name)
		if(actionNames.indexOf(actionName) === -1){
			throw new Error(`Action “${actionName}” is not in the plug-in.`)
		} else {
			if(plugin.action(actionName).validate()){
				plugin.action(actionName).perform()
			} else {
				throw new Error(`The action “${actionName}” is not validated to execute.`)
			}
		}
	}		
	

  	libTimer.taskHasDB = function(task){
    	const db = task.attachments.find(wrapper => wrapper.preferredFilename === DB_NAME)
    	return !!db
  	}

  
  	libTimer.getDB = async function(task){
    	if (!libTimer.taskHasDB(task)) {
     	 	const wrapper = FileWrapper.withContents(DB_NAME, Data.fromString('{}'))
    	  	task.addAttachment(wrapper)
    	}
   	 	return new Promise(res => {
    		Timer.once(0, () => {
        		const db = task.attachments.find(wrapper => wrapper.preferredFilename === DB_NAME)
        		res(JSON.parse(db ? db.contents.toString() : '{}'))
     		})
    	})
  	}
 
  
	libTimer.writeDB = function(task, newDB){
		if (libTimer.taskHasDB(task)) {
      		task.attachments = task.attachments.filter(wrapper => wrapper.preferredFilename !== DB_NAME)
    	}
    	const wrapper = FileWrapper.withContents(DB_NAME, Data.fromString(JSON.stringify(newDB,null,4)))
    	task.addAttachment(wrapper)
  	}


	libTimer.storeToTask = async function(task, key, value){
    	const db = await libTimer.getDB(task)	
		//console.log('storeToTask-Debug',`db = ${db},key = ${key},value = ${value}`)    
    	db[key] = value
    	Timer.once(0, () => { libTimer.writeDB(task, db) });
  	}
 
  
	libTimer.removeFromTask = async function(task, key){
    	const db = await libTimer.getDB(task)
    	delete db[key]
   	 	Timer.once(0, () => { libTimer.writeDB(task, db) });
 	 }


	libTimer.getFromTask = async function(task, key){
    	const db = await libTimer.getDB(task)
    	return db[key]
  	}


	libTimer.checkHasTaskKey = function(task, key){
    	if (task && task.attachments !== undefined) {
      		const db = task.attachments.find(wrapper => wrapper.preferredFilename === DB_NAME)
      		if (db) {
        	return JSON.parse(db.contents.toString())[key] !== undefined
      		}
   	 	}
    	return false
  	}
  
  
	libTimer.key = function(name){
    	return 'oftimer' + '-' + name
	}


	libTimer.convertTimeToTomato=function(timeSpent){
		let tomatoNumber= 0
		if (tomatoFocusDurationValue){
			tomatoNumber= timeSpent/tomatoFocusDurationValue
		}else{
			tomatoNumber= timeSpent/25	
		}	
		return tomatoNumber.toFixed(2)
	}
	
  
	libTimer.updateTomatoInTitle = function(task,timeSpent){	
		const tomato=libTimer.convertTimeToTomato(timeSpent)
		
		//patternTomato=new RegExp("(\\[tomato:)(\\d+\\.*\\d*)(\\])","gi")	
		if (patternTomato.test(task.name)){
			task.name=task.name.replace(patternTomato,"$1"+tomato+"$3")
		}else{
			task.name=task.name+`[tomato:${tomato}]`
		}
	}



	libTimer.updateTomatoInNote = function(task,timeSpent){	
		const tomato=libTimer.convertTimeToTomato(timeSpent)	
		
		//patternTomato=new RegExp("(\\[tomato:)(\\d+\\.*\\d*)(\\])","gi")	
		if (patternTomato.test(task.note)){
			task.note=task.note.replace(patternTomato,"$1"+tomato+"$3")
		}else{
			task.note=task.note+`[tomato:${tomato}]`
		}
	}



	libTimer.updatetimeSpentInTitle = function(task,timeSpent,alreadyWarn){	
		const ts=timeSpent.toFixed(2)
		
		//patternTimeSpent=new RegExp("(\\[timeSpent:)(\\d+\\.*\\d*)(m\\])","gi")	
		if (patternTimeSpent.test(task.name)){
			task.name=task.name.replace(patternTimeSpent,"$1"+ts+"$3")
		}else{
			task.name=task.name+`[timeSpent:${ts}m]`
		}
		
		//更新任务完成百分比（按timeSpent和预计持续时间estimatedMinutes）
		const estimatedTime=task.estimatedMinutes		
		if (!!estimatedTime){			
			const rateOfProgress=timeSpent/estimatedTime*100		
			const percent=rateOfProgress.toFixed(2)
			//patternPercent=new RegExp("(\\[percent:)(\\d+\\.*\\d*)(%\\])","gi")	
			if (patternPercent.test(task.name)){
				task.name=task.name.replace(patternPercent,"$1"+percent+"$3")
			}else{
				task.name=task.name+`[percent:${percent}%]`
			}
			if (percent>100){libTimer.overtimeProcess(task,"inTitle",alreadyWarn)}
		}else{ libTimer.noEstimatedMinutesProcess(task,"inTitle",alreadyWarn)}	
	}


	libTimer.updatetimeSpentInNote = function(task,timeSpent,alreadyWarn){	
		const ts=timeSpent.toFixed(2)
		
		//patternTimeSpent=new RegExp("(\\[timeSpent:)(\\d+\\.*\\d*)(m\\])","gi")	
		if (patternTimeSpent.test(task.note)){
			task.note=task.note.replace(patternTimeSpent,"$1"+ts+"$3")
		}else{
			task.note=task.note+`[timeSpent:${ts}m]`
		}
		
		//更新任务完成百分比（按timeSpent和预计持续时间estimatedMinutes）
		const estimatedTime=task.estimatedMinutes		
		if (!!estimatedTime){			
			const rateOfProgress=timeSpent/estimatedTime*100		
			const percent=rateOfProgress.toFixed(2)
			//patternPercent=new RegExp("(\\[percent:)(\\d+\\.*\\d*)(%\\])","gi")	
			if (patternPercent.test(task.note)){
				task.note=task.note.replace(patternPercent,"$1"+percent+"$3")
			}else{
				task.note=task.note+`[percent:${percent}%]`
			}
			if (percent>100) {libTimer.overtimeProcess(task,"inNote",alreadyWarn)}
		}else{ libTimer.noEstimatedMinutesProcess(task,"inNote",alreadyWarn)}		
	}


	libTimer.overtimeProcess=function(task,functionName,alreadyWarn){
		libTimer.toggleTag(task,"Timer|计时","Overtime")
		libTimer.toggleTag(task,"Kanban","Done")

		if (overtimeShouldWarnValue && !alreadyWarn){
			const alert = new Alert(`${functionName}提醒：该任务已经超过预计时间`,`${task.containingProject}/${task.name}，请考虑是否重新设置任务预计时间。`)
			alert.show()									
		}	
	}
	
	
	libTimer.noEstimatedMinutesProcess= function(task,functionName,alreadyWarn){
		if (defaultEstimatedMinutesValue){
			task.estimatedMinutes=parseInt(defaultEstimatedMinutesValue)
			console.log(`${functionName}提醒：${task.containingProject}/${task.name}的estimatedMinutes已设置为默认值：${defaultEstimatedMinutesValue}。`)
			const alert = new Alert(`${functionName}任务默认值设置提醒：`,`${task.containingProject}/${task.name}的estimatedMinutes已设置为默认值：${defaultEstimatedMinutesValue}。请运行动作“Update Project/task's TimeSpent”更新进度信息。`)
			alert.show()
		}else{
			if (!alreadyWarn){			
				const alert = new Alert(`${functionName}提醒：该任务没有预计时间`,`${task.containingProject}/${task.name}，请设置任务预计时间后再运行动作“Update Project/task's TimeSpent”，或者在运行动作SetPreference设置默认值。`)
				alert.show()			
			}
		}	
	}
	

	libTimer.updateCompletedProgressInJSON = async function(task,timeSpent,alreadyWarn){
		const tomato=libTimer.convertTimeToTomato(timeSpent)
		const ts=timeSpent.toFixed(2)	
		const estimatedTime=task.estimatedMinutes
		let percent=0		
		if (!!estimatedTime){			
			const rateOfProgress=timeSpent/estimatedTime*100		
			percent=rateOfProgress.toFixed(2)	
			if (percent>100) {libTimer.overtimeProcess(task,"inJSON",alreadyWarn)}
		}else{ libTimer.noEstimatedMinutesProcess(task,"inJSON",alreadyWarn)}	
		
		const completedProgress={
			tomato:tomato,
			timeSpent:ts,
			percent:percent
		}
		
		await libTimer.storeToTask(task, libTimer.key('completedProgress'), completedProgress)					
	}

  
	libTimer.sumTaskTimeSpent = async function(task){
		let sum = 0
		if (task.children.length > 0) {
			for (let t of task.children){
				const timeSpent = await libTimer.getFromTask(t, libTimer.key('totalTimeSpentInMinutes'));
				sum += timeSpent || 0
			}
			//将子任务的花费时间汇总存入父任务
			await libTimer.storeToTask(task, libTimer.key('totalTimeSpentInMinutes'), sum)
			await libTimer.updateCompletedProgress(task,sum)
		}else{
			const timeSpent = await libTimer.getFromTask(task, libTimer.key('totalTimeSpentInMinutes'));
			sum = timeSpent || 0
			await libTimer.updateCompletedProgress(task,sum)
		}	
		return sum	
	}	
			
	
	libTimer.updateCompletedProgress=async function(task,timeSpent){
		//统一调用接口，便于以后修改实现方式，如采用title、note、JSON或者它们的组合。
		//startTimer.js中已经将Preferences读到相关全局变量
		let alreadyWarn=false
				
		//title方式
		if (completeProgressInTitleValue){
			libTimer.updateTomatoInTitle(task,timeSpent)
			libTimer.updatetimeSpentInTitle(task,timeSpent,alreadyWarn)	
			alreadyWarn=true	
		}
		
		//note方式
		if (completeProgressInNoteValue){
			libTimer.updateTomatoInNote(task,timeSpent)
			libTimer.updatetimeSpentInNote(task,timeSpent,alreadyWarn)
			alreadyWarn=true	
		}
		
		//JSON方式
		if (completeProgressInJSONValue){
			await libTimer.updateCompletedProgressInJSON(task,timeSpent,alreadyWarn)
			alreadyWarn=true	
		}			
	}


	libTimer.setupTags=function(tagGroup,tagTitles){
		console.log(`setupTags ${tagGroup} :`,tagTitles)
		// IDENTIFY Timer TAG, CREATE IF MISSING
		let targetTag = flattenedTags.byName(tagGroup) || new Tag(tagGroup)
		
		// ADD Timer CATEGORIES IF MISSING
		tagTitles.forEach(title => {
			if (!targetTag.children.byName(title)){
				new Tag(title, targetTag)
			}
		})
		
		// REORDER THE CATEGORIES
		tagTitles.forEach(title => {
			let tag = targetTag.children.byName(title)
			moveTags([tag], targetTag)
		})	
	}

	
	libTimer.toggleTag=function(task,tagGroup,tagName){
		try {
			//console.log(`${task},${tagGroup},${tagName}`)
			let parentTag = flattenedTags.byName(tagGroup)
			if(!parentTag){
				let errMessage = `There is no “${tagGroup}” tagGroup.` 
				throw new Error(errMessage)
			}
			
			let childTag = parentTag.flattenedChildren.byName(tagName)
			if(!childTag){
				let errMessage = `There is no tag “${tagName}” in “${tagGroup}” tagGroup.` 
				throw new Error(errMessage)
			}
			
			let tagArray = parentTag.flattenedChildren;
			task.removeTags(tagArray)
			task.addTag(childTag)
		}
		catch(err){
			new Alert("Missing Tag", err.message).show()
		}	
	}
	
	
	libTimer.loadTagPreferences=function(tagName,prefix){
		let tagArray = libTimer.getTagArray(tagName)
		for(let t of tagArray){
			if (t.children.length>0) continue
			//console.log(`${prefix}${t.name}: `,preferences.readString(`${prefix}${t.name}`))
			preferencesValues[`${prefix}${t.name}`]=preferences.readString(`${prefix}${t.name}`)
		}
	}
	
	
	libTimer.getMaxNumberOfScheduledTasks=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("maxNumberOfScheduledTasks") || 20
	}
	
	
	libTimer.getTimeArrangementStrictMode=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readBoolean("timeArrangementStrictMode") || true
	}
	
	
	libTimer.getTodayPlanTimeLead=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("todayPlanTimeLead") || 30
	}
	
	
	libTimer.getStartSchedulingForTomorrow=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("startSchedulingForTomorrow") || "21:00"
	}
	
	
	libTimer.getTomatoSoundFile=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("tomatoSoundFile")
	}
	
	
	libTimer.getTomatoFocusDuration=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("tomatoFocusDuration")
	}
	
	
	libTimer.getTomatoShortRestTime=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("tomatoShortRestTime")
	}
	
	
	libTimer.getTomatoLongRestTime=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("tomatoLongRestTime")
	}
	
	
	libTimer.getTomatoNumberPerLoop=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("tomatoNumberPerLoop")
	}
	
	
	libTimer.getAcceleratedTestMode=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readBoolean("acceleratedTestMode")
	}
	
	
	libTimer.getAcceleratedTestModeTomatoDurationInSec=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("acceleratedTestModeTomatoDurationInSec")
	}
	
	
	libTimer.getOutputNoteItemBulletSymbol = function(){
		const preferences = libTimer.loadSyncedPrefs()
		let bulletSymbol=preferences.readString('outputNoteItemBulletSymbol')
		return (bulletSymbol !== null) ? bulletSymbol : '*'
	}	
	
	
	libTimer.getOutputJournalNamePrefix = function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString('outputJournalNamePrefix')
	}
	
	
	libTimer.getIOSObsidianVaultTitle=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("iOSObsidianVaultTitle")
	}
	
	
	libTimer.getMacOSObsidianVaultTitle=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("macOSObsidianVaultTitle")
	}
	
	
	libTimer.getIOSObsidianFilePathBaseOnVault=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("iOSObsidianFilePathBaseOnVault")
	}
	
	
	libTimer.getMacOSObsidianFilePathBaseOnVault=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("macOSObsidianFilePathBaseOnVault")
	}
	
	
	libTimer.getFolderIdsToExclude=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.read("folderIdsToExclude") ||[]
	}
	
	
	libTimer.getTagIdsToExclude=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.read("tagIdsToExclude") ||[]
	}
	
	
	libTimer.getDefaultEstimatedMinutes=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("defaultEstimatedMinutes") || 5
	}
	
	
	libTimer.getCompleteProgressInTitle=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readBoolean("completeProgressInTitle") || true
	}
	
	
	libTimer.getCompleteProgressInNote=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readBoolean("completeProgressInNote") || true
	}
	
	
	libTimer.getCompleteProgressInJSON=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readBoolean("completeProgressInJSON") || true
	}
	
	
	libTimer.getOvertimeShouldWarn=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readBoolean("overtimeShouldWarn") || true
	}
	
	
	libTimer.getPriorityNumberDueIn1Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn1Day")
	}
	
	
	libTimer.getPriorityNumberDueIn2Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn2Day")
	}
	
	
	libTimer.getPriorityNumberDueIn3Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn3Day")
	}
	
	
	libTimer.getPriorityNumberDueIn4Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn4Day")
	}
	
	
	libTimer.getPriorityNumberDueIn5Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn5Day")
	}
	
	
	libTimer.getPriorityNumberDueIn6Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn6Day")
	}
	
	
	libTimer.getPriorityNumberDueIn7Day=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberDueIn7Day")
	}
	
	
	libTimer.getPriorityNumberFlaged=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("priorityNumberFlaged")
	}
	
	
	libTimer.getTodayIncludeTag=function(){
		const preferences = libTimer.loadSyncedPrefs()
		return preferences.readString("todayIncludeTag") || ``
	}
	
	
	
	
	libTimer.readPreferences=function(){
		//const preferences = libTimer.loadSyncedPrefs()
		//从preferences批量读取特定tag的个性化变量值到preferencesValues
		libTimer.loadTagPreferences("Kanban", "priorityNumber-")
		libTimer.loadTagPreferences("FourQuadrant|四象限", "priorityNumber-")
		libTimer.loadTagPreferences("EstimatedTime|估计时间","priorityNumber-")
		libTimer.loadTagPreferences("TimeQuantum|时间段","")
	}
	
	
	libTimer.addTagFieldToForm=function(tagName,prefix,promptInfo,inputForm){
		let tagArray = libTimer.getTagArray(tagName)
		let tagInputs={}
		for(let t of tagArray){
			if (t.children.length>0) continue
			tagInputs[t.name] = new Form.Field.String(
				`${prefix}${t.name}`,
				`${t.name}${promptInfo}`,
				preferencesValues[`${prefix}${t.name}`]
			)
			inputForm.addField(tagInputs[t.name])
		}
	}
	
	
	libTimer.getTagFieldValidation=function(tagName,prefix,pattern,formObject){
		let tagArray = libTimer.getTagArray(tagName)
		let volidateStatus=true
		for(let t of tagArray){
			if (t.children.length>0) continue
			let fieldValue=formObject.values[`${prefix}${t.name}`]
			volidateStatus=pattern.test(fieldValue)
			if (!volidateStatus) break
		}
		return volidateStatus
	}
	
	
	libTimer.getTagArray=function(tagName){
		try{
			let parentTag = flattenedTags.byName(tagName)
			if(!parentTag){
				let errMessage = `There is no “${tagName}” tagGroup.` 
				throw new Error(errMessage)
			}	
			return parentTag.flattenedChildren
		}
		catch(err){
			new Alert("Missing Tag", err.message).show()
		}	
	}
	
	
	libTimer.storeTagFieldToPreferences=function(tagName,prefix,formObject){
		let tagArray = libTimer.getTagArray(tagName)
		for(let t of tagArray){
			if (t.children.length>0) continue
			preferences.write(`${prefix}${t.name}`, formObject.values[`${prefix}${t.name}`])
		}
	}	
	
	
	libTimer.configurePreferences=async function(){
		libTimer.readPreferences()
		var inputForm = new Form()
		
		inputForm.addField(new Form.Field.MultipleOptions(
			'foldersToExclude',
			'folders To Exclude/taskScheduling排除的文件夹',
			folders,
			folders.map(f => f.name),
			libTimer.getFolderIdsToExclude().map(f=>Folder.byIdentifier(f))))
		
		inputForm.addField(new Form.Field.MultipleOptions(
			'tagsToExclude',
			'tags To Exclude/taskScheduling排除的Tag',
			tags,
			tags.map(t => t.name),
			libTimer.getTagIdsToExclude().map(t=>Tag.byIdentifier(t))))
		
		inputForm.addField(new Form.Field.String(
			"maxNumberOfScheduledTasks",
			"max number Of scheduled tasks(5-60)",
			libTimer.getMaxNumberOfScheduledTasks()))		

		inputForm.addField(new Form.Field.String(
			"tomatoFocusDuration",
			"tomato Focus Duration in minutes(10-59)",
			libTimer.getTomatoFocusDuration()))		

		
		inputForm.addField(new Form.Field.String(
			"tomatoShortRestTime",
			"tomato Short Rest Time in minutes(0-9)",
			libTimer.getTomatoShortRestTime()))

		inputForm.addField(new Form.Field.String(
			"tomatoLongRestTime",
			"tomato Long Rest Time in minutes(0-19)",
			libTimer.getTomatoLongRestTime()))

		
		inputForm.addField(new Form.Field.String(
			"tomatoNumberPerLoop",
			"tomato Number Per Loop(1-6)",
			libTimer.getTomatoNumberPerLoop()))
		
		inputForm.addField(new Form.Field.String(
			"defaultEstimatedMinutes",
			"default EstimatedMinutes for task(1-30)",
			libTimer.getDefaultEstimatedMinutes()))
		
		if (app.platformName==="macOS"){
			let appName = app.name
			let resourceFolder = URL.fromPath(`/Applications/${appName}.app/Contents/Resources/`, true)
			let type = new TypeIdentifier("public.audio")
			let urls = await resourceFolder.find([type], false)
			let filenames = urls.map(url => {return url.lastPathComponent})
			inputForm.addField(new Form.Field.Option(
				"tomatoSoundFile",
				"tomato clock warn sounds",
				filenames,
				filenames,
				libTimer.getTomatoSoundFile()))
		}
		
		inputForm.addField(new Form.Field.String(
			"todayPlanTimeLead",
			"todayPlanTimeLead(计划今日任务时间的提前量5-60)",
			libTimer.getTodayPlanTimeLead()))
		
		inputForm.addField(new Form.Field.Checkbox(
			"timeArrangementStrictMode",
			"time Arrangement Strict Mode(工作任务不占休息时间)",
			libTimer.getTimeArrangementStrictMode()))
		
		inputForm.addField(new Form.Field.Checkbox(
			"acceleratedTestMode",
			"accelerated test mode(加速测试模式)",
			libTimer.getAcceleratedTestMode()))
	
		inputForm.addField(new Form.Field.String(
			"acceleratedTestModeTomatoDurationInSec",
			"accelerated test mode tomato duration in sec(5-60)",
			libTimer.getAcceleratedTestModeTomatoDurationInSec()))	
		
		inputForm.addField(new Form.Field.Checkbox(
			"completeProgressInTitle",
			"save completeProgress in project/task's title",
			libTimer.getCompleteProgressInTitle()))
		
		inputForm.addField(new Form.Field.Checkbox(
			"completeProgressInNote",
			"save completeProgress in project/task's note",
			libTimer.getCompleteProgressInNote()))

		inputForm.addField(new Form.Field.Checkbox(
			"completeProgressInJSON",
			"save completeProgress in project/task's JSON file",
			libTimer.getCompleteProgressInJSON()))

		inputForm.addField(new Form.Field.Checkbox(
			"overtimeShouldWarn",
			"project/task overtime should warn",
			libTimer.getOvertimeShouldWarn()))
		
		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn1Day",
			"priority Number DueIn1Days(600-999)",
			libTimer.getPriorityNumberDueIn1Day()))
		
		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn2Day",
			"priority Number DueIn2Days(200-399)",
			libTimer.getPriorityNumberDueIn2Day()))

		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn3Day",
			"priority Number DueIn3Days(100-199)",
			libTimer.getPriorityNumberDueIn3Day()))

		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn4Day",
			"priority Number DueIn4Days(0-99)",
			libTimer.getPriorityNumberDueIn4Day()))
		
		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn5Day",
			"priority Number DueIn5Days(0-99)",
			libTimer.getPriorityNumberDueIn5Day()))
		
		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn6Day",
			"priority Number DueIn6Days(0-99)",
			libTimer.getPriorityNumberDueIn6Day()))

		inputForm.addField(new Form.Field.String(
			"priorityNumberDueIn7Day",
			"Priority Number DueIn7Days(0-99)",
			libTimer.getPriorityNumberDueIn7Day()))
		
		inputForm.addField(new Form.Field.String(
			"priorityNumberFlaged",
			"Priority Number Flaged(0-400)",
			libTimer.getPriorityNumberFlaged()))
		
		inputForm.addField(new Form.Field.Option(
			'todayIncludeTag', 
			'today Include Tag', 
			flattenedTags, 
			flattenedTags.map(t => t.name),
			flattenedTags.byName(libTimer.getTodayIncludeTag())))
		
		inputForm.addField(new Form.Field.String(
			"startSchedulingForTomorrow",
			"startSchedulingForTomorrow(何时开始安排明天的时间)",
			libTimer.getStartSchedulingForTomorrow()))
		
		libTimer.addTagFieldToForm("Kanban","priorityNumber-","的priorityNumber(0-400)",inputForm)
		libTimer.addTagFieldToForm("FourQuadrant|四象限","priorityNumber-","的priorityNumber(0-400)",inputForm)
		libTimer.addTagFieldToForm("EstimatedTime|估计时间","priorityNumber-","的priorityNumber(0-200)",inputForm)
		libTimer.addTagFieldToForm("TimeQuantum|时间段","","的时间范围(格式：07:00-09:30)",inputForm)	
		
		inputForm.addField(new Form.Field.String(
			'outputNoteItemBulletSymbol', 
			'output note item bullet symbol(1-3位非字母、数字、下划线)', 
			libTimer.getOutputNoteItemBulletSymbol()))
		
		inputForm.addField(new Form.Field.String(
			'outputJournalNamePrefix', 
			'Output Journal Name Prefix', 
			libTimer.getOutputJournalNamePrefix()))
				
		inputForm.addField(new Form.Field.String(
			"iOSObsidianVaultTitle",
			"iOS obsidian vault title(数据输出用)",
			libTimer.getIOSObsidianVaultTitle()))
		
		inputForm.addField(new Form.Field.String(
			"macOSObsidianVaultTitle",
			"macOS obsidian vault title(数据输出用)",
			libTimer.getMacOSObsidianVaultTitle()))
		
		inputForm.addField(new Form.Field.String(
			"iOSObsidianFilePathBaseOnVault",
			"iOS obsidian file path base on vault(以/结尾)",
			libTimer.getIOSObsidianFilePathBaseOnVault()))
			
		inputForm.addField(new Form.Field.String(
			"macOSObsidianFilePathBaseOnVault",
			"macOS obsidian file path base on vault(以/结尾)",
			libTimer.getMacOSObsidianFilePathBaseOnVault()))
		
		let formPrompt = "请修改个性化设置参数:"
		var formPromise = inputForm.show(formPrompt,"Continue")
		
		inputForm.validate = function(formObject){
			let maxNumberOfScheduledTasksStatus=new RegExp("^([5-9]|[1-5][0-9]|[6][0])$").test(formObject.values.maxNumberOfScheduledTasks)
		
			let tomatoFocusDurationStatus=new RegExp("^([1-5][0-9])$").test(formObject.values["tomatoFocusDuration"])
			let tomatoShortRestTimeStatus=new RegExp("^([0-9])$").test(formObject.values["tomatoShortRestTime"])
			let tomatoLongRestTimeStatus=new RegExp("^([0-9]|[1][0-9])$").test(formObject.values["tomatoLongRestTime"])
			let tomatoNumberPerLoopStatus=new RegExp("^([1-6])$").test(formObject.values["tomatoNumberPerLoop"])
			let tomatoStatus=tomatoFocusDurationStatus && tomatoShortRestTimeStatus 
				&& tomatoLongRestTimeStatus && tomatoNumberPerLoopStatus
			let defaultEstimatedMinutesStatus=new RegExp("^([1-9]|[1-2][0-9]|[3][0])$").test(formObject.values["defaultEstimatedMinutes"])
			let todayPlanTimeLeadStatus=new RegExp("^([5-9]|[1-5][0-9]|[6][0])$").test(formObject.values["todayPlanTimeLead"])
			
			let acceleratedTestModeTomatoDurationInSecStatus=new RegExp("^([5-9]|[1-5][0-9]|[6][0])$")
				.test(formObject.values["acceleratedTestModeTomatoDurationInSec"])
			let completeProgressStatus=formObject.values["completeProgressInTitle"]
				|| formObject.values["completeProgressInNote"] 
				|| formObject.values["completeProgressInJSON"]

			let priorityNumberDueIn1DayStatus=new RegExp("^([6-9][0-9][0-9])$").test(formObject.values["priorityNumberDueIn1Day"])
			let priorityNumberDueIn2DayStatus=new RegExp("^([2-3][0-9][0-9])$").test(formObject.values["priorityNumberDueIn2Day"])
			let priorityNumberDueIn3DayStatus=new RegExp("^([1][0-9][0-9])$").test(formObject.values["priorityNumberDueIn3Day"])
			let priorityNumberDueIn4DayStatus=new RegExp("^([0-9]|[0-9][0-9])$").test(formObject.values["priorityNumberDueIn4Day"])
			let priorityNumberDueIn5DayStatus=new RegExp("^([0-9]|[0-9][0-9])$").test(formObject.values["priorityNumberDueIn5Day"])
			let priorityNumberDueIn6DayStatus=new RegExp("^([0-9]|[0-9][0-9])$").test(formObject.values["priorityNumberDueIn6Day"])
			let priorityNumberDueIn7DayStatus=new RegExp("^([0-9]|[0-9][0-9])$").test(formObject.values["priorityNumberDueIn7Day"])
			
			let priorityNumberFlagedStatus=new RegExp("^([0-9]|[1-9][0-9]|[1-3][0-9][0-9]|[4][0][0])$").test(formObject.values["priorityNumberFlaged"])
			//let StartSchedulingForTomorrowPattern=new RegExp("^([2][0-3]):([0-5][0-9])$")
			let startSchedulingForTomorrowStatus=StartSchedulingForTomorrowPattern.test(formObject.values["startSchedulingForTomorrow"])
			
			let kanbanNumPattern=new RegExp("^([0-9]|[1-9][0-9]|[1-3][0-9][0-9]|[4][0][0])$")
			let kanbanNumStatus=libTimer.getTagFieldValidation("Kanban","priorityNumber-",kanbanNumPattern,formObject)
			
			let fourQuadrantNumPattern=new RegExp("^([0-9]|[1-9][0-9]|[1-3][0-9][0-9]|[4][0][0])$")
			let fourQuadrantNumStatus=libTimer.getTagFieldValidation("FourQuadrant|四象限","priorityNumber-",fourQuadrantNumPattern,formObject)
			
			let estimatedTimeNumPattern=new RegExp("^([0-9]|[1-9][0-9]|[1][0-9][0-9]|[2][0][0])$")
			let estimatedTimeNumStatus=libTimer.getTagFieldValidation("EstimatedTime|估计时间","priorityNumber-",estimatedTimeNumPattern,formObject)
			
			let priorityNumberStatus=priorityNumberDueIn1DayStatus && priorityNumberDueIn2DayStatus 
				&& priorityNumberDueIn3DayStatus && priorityNumberDueIn4DayStatus 
				&& priorityNumberDueIn5DayStatus && priorityNumberDueIn6DayStatus 
				&& priorityNumberDueIn7DayStatus && priorityNumberFlagedStatus 
				&& kanbanNumStatus && fourQuadrantNumStatus && estimatedTimeNumStatus
				
			//let timeQuantumStrPattern=new RegExp("^([0-1][0-9]|[2][0-3]):([0-5][0-9])-([0-1][0-9]|[2][0-3]):([0-5][0-9])$")
			let timeQuantumStrStatus=libTimer.getTagFieldValidation("TimeQuantum|时间段","",timeQuantumStrPattern,formObject)
			
			let bulletSymbolPattern=new RegExp("^\\W{1,3}$")
			let outputNoteItemBulletSymbolStatus=bulletSymbolPattern.test(formObject.values.outputNoteItemBulletSymbol)
			let outputJournalNamePrefixStatus=(formObject.values.outputJournalNamePrefix!==``)
			let iOSObsidianVaultTitleStatus=(formObject.values.iOSObsidianVaultTitle!==``)
			let macOSObsidianVaultTitleStatus=(formObject.values.macOSObsidianVaultTitle!==``)
			let filePathPattern=new RegExp("\\/$")
			let iOSObsidianFilePathBaseOnVaultStatus=filePathPattern.test(formObject.values.iOSObsidianFilePathBaseOnVault)
			let macOSObsidianFilePathBaseOnVaultStatus=filePathPattern.test(formObject.values.macOSObsidianFilePathBaseOnVault)
			
			let outputGroupStatus=outputNoteItemBulletSymbolStatus && outputJournalNamePrefixStatus 
				&& iOSObsidianVaultTitleStatus && macOSObsidianVaultTitleStatus
				&& iOSObsidianFilePathBaseOnVaultStatus && macOSObsidianFilePathBaseOnVaultStatus
			
			let validation=maxNumberOfScheduledTasksStatus && tomatoStatus 
				&& defaultEstimatedMinutesStatus && todayPlanTimeLeadStatus 
				&& acceleratedTestModeTomatoDurationInSecStatus && completeProgressStatus 
				&& startSchedulingForTomorrowStatus && priorityNumberStatus && timeQuantumStrStatus
				&& outputGroupStatus
			return validation
		}
		
		formPromise.then(function(formObject){
			try {
				preferences.write("folderIdsToExclude", formObject.values["foldersToExclude"].map(f=>f.id.primaryKey))
				preferences.write("tagIdsToExclude", formObject.values["tagsToExclude"].map(t=>t.id.primaryKey))
				preferences.write("maxNumberOfScheduledTasks", formObject.values.maxNumberOfScheduledTasks)
				
				preferences.write("tomatoFocusDuration", formObject.values.tomatoFocusDuration)
				preferences.write("tomatoShortRestTime", formObject.values.tomatoShortRestTime)
				preferences.write("tomatoLongRestTime", formObject.values.tomatoLongRestTime)
				preferences.write("tomatoNumberPerLoop", formObject.values.tomatoNumberPerLoop)
				if (app.platformName==="macOS"){
					preferences.write("tomatoSoundFile", formObject.values.tomatoSoundFile)
				}
				preferences.write("defaultEstimatedMinutes", formObject.values.defaultEstimatedMinutes)
				preferences.write("todayPlanTimeLead", formObject.values.todayPlanTimeLead)
				
				preferences.write("timeArrangementStrictMode", formObject.values.timeArrangementStrictMode)
				preferences.write("acceleratedTestMode", formObject.values.acceleratedTestMode)
				preferences.write("acceleratedTestModeTomatoDurationInSec", formObject.values.acceleratedTestModeTomatoDurationInSec)
				
				preferences.write("completeProgressInTitle", formObject.values.completeProgressInTitle)
				preferences.write("completeProgressInNote", formObject.values.completeProgressInNote)
				preferences.write("completeProgressInJSON", formObject.values.completeProgressInJSON)
				preferences.write("overtimeShouldWarn", formObject.values.overtimeShouldWarn)
		
				preferences.write("priorityNumberDueIn1Day", formObject.values.priorityNumberDueIn1Day)
				preferences.write("priorityNumberDueIn2Day", formObject.values.priorityNumberDueIn2Day)
				preferences.write("priorityNumberDueIn3Day", formObject.values.priorityNumberDueIn3Day)
				preferences.write("priorityNumberDueIn4Day", formObject.values.priorityNumberDueIn4Day)
				preferences.write("priorityNumberDueIn5Day", formObject.values.priorityNumberDueIn5Day)
				preferences.write("priorityNumberDueIn6Day", formObject.values.priorityNumberDueIn6Day)
				preferences.write("priorityNumberDueIn7Day", formObject.values.priorityNumberDueIn7Day)
				preferences.write("priorityNumberFlaged", formObject.values.priorityNumberFlaged)
				preferences.write("todayIncludeTag", formObject.values["todayIncludeTag"].name)
				preferences.write("startSchedulingForTomorrow", formObject.values.startSchedulingForTomorrow)
				
				//preferences为全局变量，故不在函数参数中传递
				libTimer.storeTagFieldToPreferences("Kanban","priorityNumber-",formObject)
				libTimer.storeTagFieldToPreferences("FourQuadrant|四象限","priorityNumber-",formObject)
				libTimer.storeTagFieldToPreferences("EstimatedTime|估计时间","priorityNumber-",formObject)
				libTimer.storeTagFieldToPreferences("TimeQuantum|时间段","",formObject)
				
				preferences.write('outputNoteItemBulletSymbol', formObject.values.outputNoteItemBulletSymbol)
				preferences.write('outputJournalNamePrefix', formObject.values.outputJournalNamePrefix)
				preferences.write("iOSObsidianVaultTitle", formObject.values.iOSObsidianVaultTitle)
				preferences.write("macOSObsidianVaultTitle", formObject.values.macOSObsidianVaultTitle)
				preferences.write("iOSObsidianFilePathBaseOnVault", formObject.values.iOSObsidianFilePathBaseOnVault)
				preferences.write("macOSObsidianFilePathBaseOnVault", formObject.values.macOSObsidianFilePathBaseOnVault)
			}
			catch(err){
				console.error(err)
			}
		})
		
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
		
		formPromise.finally(()=>{
			libTimer.validatePreferences("Action:setPreferences")	
		})
	}


	libTimer.validatePreferences=function(functionName){
		libTimer.readPreferences()
		libTimer.outputPreferences(functionName)	
		if(!completeProgressInTitleValue && !completeProgressInNoteValue && !completeProgressInJSONValue){
			throw {
				name: "invalid preference",
				message: '三种保存完成进度（completeProgress）的方式至少选择一种.\n\nRun the action "set Preferences" to summon the preferences dialog.'
			}
		}
	}


  	libTimer.outputPreferences=function(functionName){
  		console.log(`output in ${functionName}`)
  		console.log("folderIdsToExclude: ", libTimer.getFolderIdsToExclude().map(f=>Folder.byIdentifier(f).name))
		console.log("tagIdsToExclude: ", libTimer.getTagIdsToExclude().map(t=>Tag.byIdentifier(t).name))
		console.log("maxNumberOfScheduledTasks: ", libTimer.getMaxNumberOfScheduledTasks())
		
  		console.log("tomatoFocusDuration: ", libTimer.getTomatoFocusDuration())
		console.log("tomatoShortRestTime: ", libTimer.getTomatoShortRestTime())
		console.log("tomatoLongRestTime: ", libTimer.getTomatoLongRestTime())
		console.log("tomatoNumberPerLoop: ",libTimer.getTomatoNumberPerLoop())
		console.log("tomatoSoundFile: ",libTimer.getTomatoSoundFile())
		console.log("defaultEstimatedMinutes: ",libTimer.getDefaultEstimatedMinutes())
		console.log("todayPlanTimeLead: ",libTimer.getTodayPlanTimeLead())
		
		console.log("timeArrangementStrictMode: ", timeArrangementStrictModeValue)
		console.log("acceleratedTestMode: ", libTimer.getAcceleratedTestMode())
		console.log("acceleratedTestModeTomatoDurationInSec: ", 
			libTimer.getAcceleratedTestModeTomatoDurationInSec())
		
  		console.log("completeProgressInTitle: ", libTimer.getCompleteProgressInTitle())
		console.log("completeProgressInNote: ", libTimer.getCompleteProgressInNote())
		console.log("completeProgressInJSON: ", libTimer.getCompleteProgressInJSON())
		console.log("overtimeShouldWarn: ",libTimer.getOvertimeShouldWarn())

		console.log("priorityNumberDueIn1Day: ", libTimer.getPriorityNumberDueIn1Day())
		console.log("priorityNumberDueIn2Day: ", libTimer.getPriorityNumberDueIn2Day())
		console.log("priorityNumberDueIn3Day: ", libTimer.getPriorityNumberDueIn3Day())
		console.log("priorityNumberDueIn4Day: ", libTimer.getPriorityNumberDueIn4Day())
		console.log("priorityNumberDueIn5Day: ", libTimer.getPriorityNumberDueIn5Day())
		console.log("priorityNumberDueIn6Day: ", libTimer.getPriorityNumberDueIn6Day())
		console.log("priorityNumberDueIn7Day: ", libTimer.getPriorityNumberDueIn7Day())
		console.log("priorityNumberFlaged: ", libTimer.getPriorityNumberFlaged())
		console.log("todayIncludeTag: ", libTimer.getTodayIncludeTag())
		
		console.log("startSchedulingForTomorrow: ", libTimer.getStartSchedulingForTomorrow())
		libTimer.outputTagPreferences("Kanban", "priorityNumber-")
		libTimer.outputTagPreferences("FourQuadrant|四象限", "priorityNumber-")
		libTimer.outputTagPreferences("EstimatedTime|估计时间","priorityNumber-")
		libTimer.outputTagPreferences("TimeQuantum|时间段","")
		
		console.log("outputNoteItemBulletSymbol: ", libTimer.getOutputNoteItemBulletSymbol())
		console.log("outputJournalNamePrefix: ", libTimer.getOutputJournalNamePrefix())
		console.log("iOSObsidianVaultTitle: ", libTimer.getIOSObsidianVaultTitle())
		console.log("macOSObsidianVaultTitle: ", libTimer.getMacOSObsidianVaultTitle())
		console.log("iOSObsidianFilePathBaseOnVault: ", libTimer.getIOSObsidianFilePathBaseOnVault())
		console.log("macOSObsidianFilePathBaseOnVault: ", libTimer.getMacOSObsidianFilePathBaseOnVault())
  	}

	
	libTimer.outputTagPreferences=function(tagName,prefix){
		let tagArray = libTimer.getTagArray(tagName)
		for(let t of tagArray){
			if (t.children.length>0) continue
			console.log(`${prefix}${t.name}: `,preferences.readString(`${prefix}${t.name}`))
		}
	}
	
	

	libTimer.RegExpClean=function(pattern,task){
		if (pattern.test(task.name)){
			task.name=task.name.replace(pattern,"")
		}
		if (pattern.test(task.note)){
			task.note=task.note.replace(pattern,"")
		}
	}

	
	libTimer.cleanCompletedProgress=async function(task){
		console.log("clean time tracking data:",task.name)	
		
		//let patternTomato=new RegExp("(\\[tomato:)(\\d+\\.*\\d*)(\\])","gi")			
		libTimer.RegExpClean(patternTomato,task)		
		//let patternTimeSpent=new RegExp("(\\[timeSpent:)(\\d+\\.*\\d*)(m\\])","gi")	
		libTimer.RegExpClean(patternTimeSpent,task)
		//let patternPercent=new RegExp("(\\[percent:)(\\d+\\.*\\d*)(%\\])","gi")	
		libTimer.RegExpClean(patternPercent,task)	
		
		await libTimer.removeFromTask(task, libTimer.key('start'))
		await libTimer.removeFromTask(task, libTimer.key('totalTimeSpentInMinutes'))
		await libTimer.removeFromTask(task, libTimer.key('timeLogs'))
		await libTimer.removeFromTask(task, libTimer.key('completedProgress'))	
	}
 
  
	libTimer.doClean=async function(selection){
		if (selection.projects && selection.projects.length > 0){
			for (let p of selection.projects){
				for (let t of p.tasks){
					await libTimer.cleanCompletedProgress(t)
					if (t.children.length>0){
						for (let tc of t.children){
							await libTimer.cleanCompletedProgress(tc)
						}				
					}
				}
				await libTimer.cleanCompletedProgress(p.task)
			}
		}else{
			for (let t of selection.tasks){				
				await libTimer.cleanCompletedProgress(t)
				if (t.children.length>0){
					for (let tc of t.children){
						await libTimer.cleanCompletedProgress(tc)
					}
				}	
			}			
		}  
  	}
  
 
 	libTimer.computePriorityNumber=function(task){		
		let priorityNumber=0
		
		//累计DueDate的优先数
		let now = new Date()
		let cal = Calendar.current
		let today = cal.startOfDay(now)
		let dc = new DateComponents()
		dc.day = 7
		let targetDate = cal.dateByAddingDateComponents(today,dc)
		//DueDate<7天，则取DueDate对应的优先数
		if (task.effectiveDueDate<targetDate){
			for (let i=1;i<8;i++) {
				dc.day = i
				targetDate = cal.dateByAddingDateComponents(today,dc)
				if (task.effectiveDueDate<targetDate){
					priorityNumber+=parseInt(preferences.readString(`priorityNumberDueIn${i}Day`))
					//console.log(`task:=${task.name},i=${i},DueDate=${task.effectiveDueDate},priorityNumber=${priorityNumber}`)
					break
				}
			}
		}
		
		//Kanban tag
		let tagArray=libTimer.getTagArray("Kanban")
		for (let t of tagArray){
			if (libTimer.taskHasTagObj(task,t)){
				priorityNumber+=parseInt(preferences.readString(`priorityNumber-${t.name}`))
				//console.log(`task:=${task.name},tag=${t.name},priorityNumber=${priorityNumber}`)
				break
			}
		}
		
		//四象限tag
		tagArray=libTimer.getTagArray("FourQuadrant|四象限")
		for (let t of tagArray){
			if (libTimer.taskHasTagObj(task,t)){
				priorityNumber+=parseInt(preferences.readString(`priorityNumber-${t.name}`))
				//console.log(`task:=${task.name},tag=${t.name},priorityNumber=${priorityNumber}`)
				break
			}
		}
		
		//Flagged
		if (task.effectiveFlagged) {
			priorityNumber+=parseInt(preferences.readString(`priorityNumberFlaged`))
			//console.log(`task:=${task.name},Flagged=${task.effectiveFlagged},priorityNumber=${priorityNumber}`)
		}
		
		//EstimatedTime｜估计时间
		tagArray=libTimer.getTagArray("EstimatedTime|估计时间")
		let hasTag=false
		for (let t of tagArray){
			if (libTimer.taskHasTagObj(task,t)){
				priorityNumber+=parseInt(preferences.readString(`priorityNumber-${t.name}`))
				//console.log(`task:=${task.name},tag=${t.name},priorityNumber=${priorityNumber}`)
				hasTag=true
				break				
			}
		}
		//estimatedMinutes
		if (!hasTag &&task.estimatedMinutes){
			switch  (true){
				case task.estimatedMinutes>60:
					priorityNumber+=parseInt(preferences.readString(`priorityNumber-BigFrog|>1h`));
					break;
				case task.estimatedMinutes>30 && task.estimatedMinutes<=60:
					priorityNumber+=parseInt(preferences.readString(`priorityNumber-SmallFrog|30-60m`));
					break;
				case task.estimatedMinutes>15 && task.estimatedMinutes<=30:
					priorityNumber+=parseInt(preferences.readString(`priorityNumber-Quarter|15-30m`));
					break;
				case task.estimatedMinutes>5 && task.estimatedMinutes<=15:
					priorityNumber+=parseInt(preferences.readString(`priorityNumber-ShortTime|5-15m`));
					break;
				case task.estimatedMinutes<5:
					priorityNumber+=parseInt(preferences.readString(`priorityNumber-FewMinutes|<5m`));
					break;			
			}	
		}		
		
		//剩余时间，暂不考虑
						
		//deferDate
		dc.day = 1
		targetDate = cal.dateByAddingDateComponents(today,dc)
		if (task.effectiveDeferDate>targetDate){//如果推迟到1天后
			priorityNumber-=1000 //可作为preferences参数
			//console.log(`task=${task.name},DeferDate=${task.effectiveDeferDate}`)
		}
			
 		console.log(`computePriorityNumber:task=${task.name},priorityNumber=${priorityNumber}`)
 		return priorityNumber
 	}
  
	
	libTimer.jobSort=function(pre,next){
		switch (true){
			case pre.priorityNumber>next.priorityNumber:
				return -1;
			case pre.priorityNumber<next.priorityNumber:		
				return 1;
			case pre.priorityNumber=next.priorityNumber:
				//优先数相同时，先看dueDate，再看fourQuadrant
				if ((pre.effectiveDueDate-next.effectiveDueDate)!==0){
					return pre.effectiveDueDate-next.effectiveDueDate;	
				}else{
					return libTimer.fourQuadrantCompare(pre,next)
				};
		}	
		return 0
	}

	
	libTimer.fourQuadrantCompare=function(taskA,taskB){
		switch (true){
			case libTimer.taskHasTagName(taskA,"ImportanceUrgency"):
				return (libTimer.taskHasTagName(taskB,"ImportanceUrgency")) ? 0:-1;
			case libTimer.taskHasTagName(taskA,"Importance"):
				return (libTimer.taskHasTagName(taskB,"Importance")) ? 0:-1;
			case libTimer.taskHasTagName(taskA,"Urgency"):
				return (libTimer.taskHasTagName(taskB,"Urgency")) ? 0:-1;
			case libTimer.taskHasTagName(taskB,"Urgency"):
				return 1;
			case libTimer.taskHasTagName(taskB,"Importance"):
				return 1;
			case libTimer.taskHasTagName(taskB,"ImportanceUrgency"):
				return 1;
			default:
				return 0;
		}		
	}
	
	
	libTimer.taskHasTagObj=function(task,tagObj){
		let taskTagSet=new Set(task.tags)
		//console.log(`taskHasTagObj:${task.name}has tag${tagObj.name} is:${taskTagSet.has(tagObj)}`)
		return  taskTagSet.has(tagObj)
	}
	
	
	libTimer.taskHasTagName=function(task,tagName){
		let taskTagSet=new Set(task.tags)
		let targetTag = flattenedTags.byName(tagName)
		//console.log(`taskHasTagName:${task.name}has tag${tagName} is:${taskTagSet.has(targetTag)}`)
		return  taskTagSet.has(targetTag)
	}
	
	
	libTimer.estimatedTimeCompare=function(taskA,taskB){
		let aTime=taskA.estimatedMinutes || 0
		let btime=taskB.estimatedMinutes || 0
		aTime=Math.max(aTime,libTimer.tagToTime(taskA))
		bTime=Math.max(bTime,libTimer.tagToTime(taskB))	
		return bTime-aTime		
	}
	
	
	libTimer.tagToTime=function(task){
		//console.log(`tagToTime:task.name=${task.name}`)
		if (libTimer.taskHasTagName(task,"BigFrog|>1h")) {return 90}	
		if (libTimer.taskHasTagName(task,"SmallFrog|30-60m")) {return 60}	
		if (libTimer.taskHasTagName(task,"Quarter|15-30m"))  {return 30}
		if (libTimer.taskHasTagName(task,"ShortTime|5-15m"))  {return 15}
		if (libTimer.taskHasTagName(task,"FewMinutes|<5m"))  {return 5}	
		return 0
	}
	
	
	
	libTimer.selectModeAndRunScheduling =function(){
		const foldersToInclude=[]
		const tagsToInclude=[]
		const selectModeForm = new Form()
		const selectModePopupMenu = new Form.Field.Option(
			'selecteMode',
			'SchedulingMode/调度模式',
			['topLevelFolder', 'Tag', 'All'],
			['Top Level Folder/顶层文件夹', 'the specified Tag/指定Tag', 'All/全范围'],
			'All'
		)
		selectModeForm.addField(selectModePopupMenu)
		const selectModeFormPrompt = 'Which SchedulingMode/调度模式?'
		const selectModeFormPromise = selectModeForm.show(selectModeFormPrompt, 'Continue')

		const selectTopLevelFolderForm = new Form()
		const selectTopLevelFolderFolderField = new Form.Field.MultipleOptions('foldersToInclude', 'folders To Include/包含的文件夹', folders, folders.map(t => t.name),foldersToInclude)
		selectTopLevelFolderForm.addField(selectTopLevelFolderFolderField)
		const selectTopLevelFolderFormPrompt = 'Select Folders:'

		const selectTagForm = new Form()
		const selectTagTagField = new Form.Field.MultipleOptions('tagsToInclude', 'tags To Include/包含的Tag', tags, tags.map(t => t.name),tagsToInclude)
		selectTagForm.addField(selectTagTagField)
		const selectTagFormPrompt = 'Select Tags:'
		
		selectModeFormPromise.then(function (formObject) {
			const optionSelected = formObject.values.selecteMode
			let selectTopLevelFolderFormPromise
			let selectTagFormPromise
		  	let selectFolders
		  	let selectTags
		  	switch (optionSelected) {
			case 'topLevelFolder':
				console.log(`select topLevelFolder Mode`)
			  	selectTopLevelFolderFormPromise = selectTopLevelFolderForm.show(
					selectTopLevelFolderFormPrompt,'Continue')
			  	selectTopLevelFolderForm.validate=function(formObject){
					selectFolders = formObject.values.foldersToInclude
					return selectFolders.length>0
				}
			  	selectTopLevelFolderFormPromise.then(function (formObject) {
					selectFolders = formObject.values.foldersToInclude
					console.log(selectFolders)
					libTimer.doTaskScheduling(optionSelected,selectFolders)
			  	})
			  	selectTopLevelFolderFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
			  	})
			  	break
			case 'Tag':
			  	console.log(`select Tag Mode`)
				selectTagFormPromise = selectTagForm.show(selectTagFormPrompt,'Continue')
				selectTagForm.validate=function(formObject){
					selectTags = formObject.values.tagsToInclude
					return selectTags.length>0
				}
				selectTagFormPromise.then(function (formObject) {
					selectTags = formObject.values.tagsToInclude
					console.log(selectTags)
					libTimer.doTaskScheduling(optionSelected,selectTags)
				})
				selectTagFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'All':
				console.log(`select All Mode`)
				libTimer.doTaskScheduling(optionSelected,null)
			  	break
			default:
		  	}
		})

		selectModeFormPromise.catch(function (err) {
			console.log('form cancelled', err.message)
		})
  	}

  
	libTimer.isAvailableTask=function(task,todayIncludeTag,targetDate){
		if (task.taskStatus===Task.Status.Blocked){return false} 
		if (task.taskStatus===Task.Status.Droppd){return false} 
		if (task.taskStatus===Task.Status.Completed){return false} 
		if (task.hasChildren){return false} 
		if (task.effectiveDueDate>targetDate){return false} //dueDate>7
		if (task.effectiveDeferDate>targetDate){return false} //deferDate>7	
		if (task.effectiveDueDate===null){
			if (todayIncludeTag!==null && libTimer.taskHasTagName(task,todayIncludeTag)){
				console.log(`包含tag: ${todayIncludeTag},task.name=${task.name},${task.taskStatus}`)
			}else{return false}							
		}
		console.log(`itemSet.add: task.name=${task.name},${task.taskStatus}`)
		return true
	}
	
  	
  	libTimer.clearTagFromAllTask=function(tagName){
  		let targetTag = flattenedTags.byName(tagName)
		if(!targetTag){
			let errMessage = `There is no “${tagName}” tag. Please run the “initialize tags” action to add the missing tag.`
			throw new Error(errMessage)
		}
		let tagArray = targetTag.flattenedChildren
		console.log(`tagArray =${tagArray}`)
		targetTag.tasks.forEach(t=>{t.removeTags(tagArray)})
  	}
  	
  	
	
	libTimer.doTaskScheduling=async function(runMode,optionDatas){
		try{
			console.log(`doTaskScheduling:runMode=${runMode},optionDatas=${optionDatas}`)
			//清空task的"Scheduling｜调度"tag
			libTimer.clearTagFromAllTask("Scheduling|调度")
			libTimer.clearTagFromAllTask("TimeQuantum|时间段")
			//取得排除Folders(直接取tasks太多)
			let foldersToExclude=[]
			let folderIdsToExclude=libTimer.getFolderIdsToExclude()
			if (folderIdsToExclude && folderIdsToExclude.length>0){
				foldersToExclude=folderIdsToExclude.map(f=>Folder.byIdentifier(f))
				if (foldersToExclude && foldersToExclude.length>0){
					console.log(`foldersToExclude:${foldersToExclude}`)
				}
			}
			//取得排除Tags关联的tasks
			let excludeTagsCorrelativeTasks=[]
			let tagIdsToExclude=libTimer.getTagIdsToExclude()
			if (tagIdsToExclude && tagIdsToExclude.length>0){
				let tagObjs=tagIdsToExclude.map(t=>Tag.byIdentifier(t))
				if (tagObjs && tagObjs.length>0){
					console.log(`tagsToExclude:${tagObjs}`)
					for (let t of tagObjs){
						if (t.tasks && t.tasks.length>0){
							excludeTagsCorrelativeTasks=excludeTagsCorrelativeTasks.concat(t.tasks)
						}
					}
				}
			}
			console.log(`excludeTagsCorrelativeTasks=${excludeTagsCorrelativeTasks}`)
			
			let now = new Date()
			let cal = Calendar.current
			let today = cal.startOfDay(now)
			let dc = new DateComponents()
			let targetDate
			let itemSet = new Set()
			let jobs = new Array()
			dc.day = 7
			targetDate = cal.dateByAddingDateComponents(today,dc)
			
			let todayIncludeTag=preferences.readString("todayIncludeTag")
			let availableTask
			switch(runMode){
				case 'topLevelFolder':
					for (let f of optionDatas){
						for (let p of f.flattenedProjects){
							for (let t of p.flattenedTasks){
								if (!(excludeTagsCorrelativeTasks && excludeTagsCorrelativeTasks.includes(t))){
									if (libTimer.isAvailableTask(t,todayIncludeTag,targetDate)){itemSet.add(t)}
								}
							}
						}
					}
					break
				case `Tag`:
					for (let tag of optionDatas){
						for (let t of tag.tasks){
							if (!(foldersToExclude && foldersToExclude.includes(libTimer.getTaskTopLevelFolder(t)))){
								if (libTimer.isAvailableTask(t,null,targetDate)){itemSet.add(t)}
							}
						}
					}
					break
				case `All`:
					for (let p of flattenedProjects){
						for (let t of p.flattenedTasks){
							if (!(excludeTagsCorrelativeTasks && excludeTagsCorrelativeTasks.includes(t)) &&
								!(foldersToExclude && foldersToExclude.includes(libTimer.getTaskTopLevelFolder(t)))){
									if (libTimer.isAvailableTask(t,todayIncludeTag,targetDate)){itemSet.add(t)}
							}
						}
					}
					break
			}
				
			let items=Array.from(itemSet)
			console.log(`items.length=${items.length}`)			
		
			for (let i of items){
				if (!i.estimatedMinutes){
					i.estimatedMinutes=libTimer.tagToTime(i)
				}else{
					libTimer.checkEstimatedMinutes(i)
				}				
				let job = {
					obj:i,
					taskId:i.id.primaryKey,			
					taskName:i.name,
					effectiveDeferDate:i.effectiveDeferDate,
					effectiveDueDate:i.effectiveDueDate,
					estimatedMinutes:i.estimatedMinutes,
					timeSpent:await libTimer.getTimeSpent(i),
					effectiveFlagged:i.effectiveFlagged,
					completed:i.completed,
					containingProject:i.containingProject,
					note:i.note,
					parent:i.parent,
					containingProject:i.containingProject,
					hasChildren:i.hasChildren,
					tags:i.tags,
					priorityNumber:	libTimer.computePriorityNumber(i),
					jobType:libTimer.getJobType(i),
					scheduleStatus:0,
					planRecords:[],
					implementRecords:[]
				}
				jobs.push(job)			
			}
									
			//根据优先数倒序排序
			jobs.sort(libTimer.jobSort)
			
			//设置"Scheduling｜调度"tag
			let maxNumberOfScheduledTasks=parseInt(libTimer.getMaxNumberOfScheduledTasks())
			let listLength=(jobs.length>maxNumberOfScheduledTasks)?maxNumberOfScheduledTasks:jobs.length
			  
			for(let i=0;i<listLength;i++){
				libTimer.toggleTag(jobs[i].obj,"Scheduling|调度","Scheduled")									
			}	
			
			preferences.write("jobs",jobs)

			let title=`“task scheduling”执行完毕`
			let message=`当前运行模式是：${runMode}。\n`
			message+=`待分配jobs(task)共${jobs.length}个。\n\n`
			if (jobs.length>0){
				message+=`第一个待执行的task是：\n`
				message+=`task=${jobs[0].obj},containingProject=${jobs[0].containingProject},`
				message+=`priorityNumber=${jobs[0].priorityNumber},jobType=${jobs[0].jobType}\n\n`
			}
			message+=`可打开控制台查看更详细的log信息。\n\n`
			message+=`随后可从自动化菜单的Smart Scheduling and Timing子菜单运行time arrangement动作安排任务执行时间。\n\n`
			message+=`可随时通过调整“Scheduling|调度”Tag视图中任务的Flaged、四象限Tag、预测视图的今日tag、Due、Defer等参数改变待执行任务列表，`
			message+=`再从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作。\n`
			
			console.log(title)
			console.log(message)
			let i=0
			for (let t of jobs){
				let message=`job`+libTimer.getRecordStr(i,t,`taskName`)
				console.log(message)		
				i++
			}
			
			let alert=new Alert(title,message)
			if (app.platformName==="iOS"){
				alert.addOption('显示Tag视图')
				alert.addOption('分配时间')
				const alertPromise = alert.show()

				alertPromise.then(buttonIndex => {
					switch (buttonIndex) {
						case 0:
							console.log(`buttonIndex0`)
							let tagIDs = targetTag.children.map(tag => tag.id.primaryKey)
							let tagIDsString =  tagIDs.join(",")
							URL.fromString("omnifocus:///tag/" + tagIDsString).open()
							break;
						case 1:
							console.log(`buttonIndex1`)
							libTimer.performPlugInAction("com.Macrosoft.of-smartSchedulingAndTiming","timeArrangement")
					}
				})
			}else{//macOS不支持上述对话操作
				alert.show()
			}
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}	
	}
	
	
	libTimer.checkEstimatedMinutes=function(task){
		//console.log(`checkEstimatedMinutes:task.name=${task.name}`)
		let tagTime=libTimer.tagToTime(task)
		if (tagTime!==0){
			if (tagTime<task.estimatedMinutes){
				const msg=`task:${task.name}的estimatedMinutes=${task.estimatedMinutes}，\n与“EstimatedTime|估计时间”tag指示的（${tagTime}）不符。\n是否按tag指示时间修改？`
				const alert = new Alert('数据修改确认？', msg)
				alert.addOption('修改')
				alert.addOption('不修改')
				const alertPromise = alert.show()

				alertPromise.then(buttonIndex => {
					switch (buttonIndex) {
						case 0:
							task.estimatedMinutes=tagTime;
							break;
					}
				})
			}
		}			
	}
	
	
	libTimer.getTimeSpent=async function(task){	
		if (task===undefined) return 0
		//优先从title，其次从note，最后从JSON
		//var patternTimeSpent=new RegExp("(\\[timeSpent:)(\\d+\\.*\\d*)(m\\])","gi")	
		if (patternTimeSpent.test(task.name)){
			return RegExp.$2
		}else{
			if (patternTimeSpent.test(task.note)){
				return RegExp.$2
			}else{
				const timeSpent = await libTimer.getFromTask(task, libTimer.key('totalTimeSpentInMinutes'))
				if (timeSpent){					
					return timeSpent
				}
			}		
		}	
		return 0
	}	


	libTimer.getTaskTopLevelFolder=function(task){
		let pf=null
		let p=task.containingProject
		if (p!==null){
			let f=p.parentFolder
			while (f!==null){
				pf=f
				if (f.parent!==null){
					pf=f.parent
					f=pf.parent
				}else{f=null}					
			}
		}
		return pf
	}


	libTimer.getJobType=function(task){
		let jobType="其它"
		let pf=libTimer.getTaskTopLevelFolder(task)
		if (pf!==null){
			if (pf.name==="工作"){
				jobType="工作"		
			}else{
				if (pf.name==="生活"){
					jobType="生活"
				}
			}
		}	
		return jobType
	}


	libTimer.getTimeQuantumType=function(tag){	
		try{
			if (tag.parent===null){
				let errMessage=`Tag："${tag.name}"设置错误,没有parent Tag,请先从自动化菜单的Smart Scheduling and Timing子菜单运行initialize tags动作。`
				throw new Error(errMessage)	
			}
			switch (tag.parent.name){
				case "WorkTime|工作时间":
					return "工作";
				case "RestTime|休息时间":
					return "生活";
				default:
					let errMessage=`Tag："${tag.name}"的parent Tag设置有误,请先从自动化菜单的Smart Scheduling and Timing子菜单运行initialize tags动作。`
					throw new Error(errMessage)	
			}
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}
	}

	
	libTimer.getTimeQuantums=function(date){
		//let timeQuantumStrPattern=new RegExp("^([0-1][0-9]|[2][0-3]):([0-5][0-9])-([0-1][0-9]|[2][0-3]):([0-5][0-9])$")
		try{
			let cal = Calendar.current
			let timeQuantums=new Array()
			let tagArray = libTimer.getTagArray("TimeQuantum|时间段")
			let dc1 = new DateComponents()
			let dc2 = new DateComponents()

			for(let t of tagArray){
				if (t.children.length>0) continue
				let timeQuantumStr=preferences.readString(`${t.name}`)
				if (timeQuantumStrPattern.test(timeQuantumStr)){
					dc1.hour=parseInt(RegExp.$1)
					dc1.minute=parseInt(RegExp.$2)
					dc2.hour=parseInt(RegExp.$3)
					dc2.minute=parseInt(RegExp.$4)
					let timeQuantum={
						timeQuantumName:t.name,
						timeQuantumStr:timeQuantumStr,
						start:cal.dateByAddingDateComponents(date,dc1),
						end:cal.dateByAddingDateComponents(date,dc2),
						vernierPosition:cal.dateByAddingDateComponents(date,dc1),
						timeQuantumType:libTimer.getTimeQuantumType(t)
					}
					timeQuantums.push(timeQuantum)		
				}else{
					//时间段参数设置错误或未设置
					let errMessage=`时间段"${t.name}"参数设置错误或未设置,请先从自动化菜单的Smart Scheduling and Timing子菜单运行set Preferences动作。`
					throw new Error(errMessage)		
				}
				//排序时间段
				timeQuantums=timeQuantums.sort((a,b)=>{return a.start-b.start})
				
				//检查时间段是否有重叠
				for (let i=0;i<timeQuantums.length-1;i++){
					if (timeQuantums[i].stop>timeQuantums[i+1].start){
						let errMessage=`"${timeQuantums[i].TimeQuantumName}"与"${timeQuantums[i+1].TimeQuantumName}"时间重叠,请先从自动化菜单的Smart Scheduling and Timing子菜单运行set Preferences动作。`
						throw new Error(errMessage)	
					}
				}							
			}
			return timeQuantums
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}		
	}
	
	
	libTimer.getAvailableTimeQuantums=function(timeQuantums,planTimeStartingPoint){
		for (let tq of timeQuantums){
			if (tq.vernierPosition<planTimeStartingPoint){
				tq.vernierPosition=(tq.end>planTimeStartingPoint)?planTimeStartingPoint:tq.end
			}
		}
		return timeQuantums
	}
	
	
	libTimer.getJobTimeslice=function(jobType,duration,timeQuantums,timeArrangementStrictMode){
		let cal = Calendar.current
		let dc = new DateComponents()
		let timeslice={
			duration:0,
			start:null,
			stop:null,
			timeQuantumName:null
		}
		dc.minute=duration
		
		for (let tq of timeQuantums){
			switch(true){
				case timeArrangementStrictMode
					&&tq.timeQuantumType===jobType
					&&tq.end-tq.vernierPosition>duration:
					//继续执行后续语句
				case !timeArrangementStrictMode
					&&tq.end-tq.vernierPosition>duration:
					timeslice={
						duration:duration,
						start:tq.vernierPosition,
						stop:cal.dateByAddingDateComponents(tq.vernierPosition,dc),
						timeQuantumName:tq.timeQuantumName
					}
					tq.vernierPosition=timeslice.stop
					break;
			}
		}
		console.log(`getJobTimeslice:mode=${timeArrangementStrictMode},d=${timeslice.duration},start=${timeslice.start},stop=${timeslice.stop},${jobType}`)
		return timeslice
	}

	
	libTimer.cleanJobTimeRecords=function(jobs){
		for (let job of jobs){
			job.planRecords=[]
			job.implementRecords=[]
			job.scheduleStatus=0//0表示未分配状态
		}
		preferences.write("jobs",jobs)
	}
	
	
	
	libTimer.timeArrangementForJobs=function(date,timeQuantums,availableJobs,tomatoJobs){
		try{
			console.log(`[timeArrangementForJobs] timeStartPoint=${date},availableJobs.length=${availableJobs.length}`)
			let cal = Calendar.current
			let dc = new DateComponents()
			//无可用时间分配警告标志置初值
			let noAvailableTimeAlertFlag={}
			let jobTypes=availableJobs.map(j=>j.jobType)
			let jobTypesSet=new Set(jobTypes)
			jobTypes=Array.from(jobTypesSet)//去重
			jobTypes.forEach(j=>noAvailableTimeAlertFlag[j]=true)
		
			let planTimeStartingPoint=date
			let tomatoFocusDuration=parseInt(libTimer.getTomatoFocusDuration())
			let tomatoShortRestTime=parseInt(libTimer.getTomatoShortRestTime())
			let tomatoLongRestTime=parseInt(libTimer.getTomatoLongRestTime())
			let tomatoNumberPerLoop=parseInt(libTimer.getTomatoNumberPerLoop())
			
			let tomatoNumber=0
			let oldTomatoNumber=0
			let tomatoJob=null
			let timeslice=null
			let timeArrangementStrictMode=libTimer.getTimeArrangementStrictMode()
			let availableTimeQuantums=libTimer.getAvailableTimeQuantums(timeQuantums,planTimeStartingPoint)
			for (let t of availableJobs){
				let remainingTime=0
				let taskRemainingTime=t.estimatedMinutes-t.timeSpent
				if (!taskRemainingTime) {
					remainingTime=tomatoFocusDuration
				}else{
					remainingTime=(taskRemainingTime<=0) ? tomatoFocusDuration:taskRemainingTime
				}
				//console.log(`for: t=${t.taskName},remainingTime=${remainingTime}`)	
				while (remainingTime>0){
					//console.log(`while: remainingTime=${remainingTime}`)				
					let planDuration=Math.min(tomatoFocusDuration,remainingTime)
					//根据jobType取得可分配时间片timeslice
					timeslice=libTimer.getJobTimeslice(
						t.jobType,planDuration,availableTimeQuantums,timeArrangementStrictMode)
					if (timeArrangementStrictMode&&timeslice.duration===0&&(t.jobType==="生活" || t.jobType==="其它")){
						//对于非工作类任务如在严格模式下分配时间片失败，改为非严格模式重新分配一次(不限时间类型)
						timeslice=libTimer.getJobTimeslice(t.jobType,planDuration,timeQuantums,false)
					}
					
					if (timeslice.duration===0){
						if (noAvailableTimeAlertFlag[t.jobType]){
							let message=`timeArrangementStrictMode=${timeArrangementStrictMode},当日已无(${t.jobType})类任务可用时间供分配。`
							message+=`“${t.containingProject}”/任务"${t.name}"未分配时间。\n`
							message+=`可通过调整“Scheduling|调度”Tag视图中任务的Flaged、四象限Tag、预测视图的今日tag、Due、Defer等参数改变待执行任务列表，`
							message+=`再从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作和本动作。`	
							console.log(message)
							new Alert(`可分配(${t.jobType})类任务的时间不足`,message).show()
							noAvailableTimeAlertFlag[t.jobType]=false//同类任务只警告一次
						}
						break //退出while
					}else{//分配时间成功
						//修改task的时间分配信息
						let planRecord={
							duration:timeslice.duration,
							start:timeslice.start,
							stop:timeslice.stop
						}
						t.planRecords.push(planRecord)
						t.scheduleStatus=1 //已安排时间
						let task=Task.byIdentifier(t.taskId)
						libTimer.toggleTag(task,"Scheduling|调度","Arranged")
						libTimer.toggleTag(task,"TimeQuantum|时间段",timeslice.timeQuantumName)	
						//修改task剩余时间变量信息
						remainingTime-=timeslice.duration
						//新建tomatoJob
						tomatoJob={
							taskId:t.taskId,
							taskName:t.taskName,
							containingProject:t.containingProject,
							duration:timeslice.duration,
							start:timeslice.start,
							stop:timeslice.stop,
							jobType:t.jobType,
							implementStart:null,
							implementStop:null,
							runMode:null,
							runState:null
						}
						tomatoJobs.push(tomatoJob)
						//修改相关工作变量
						tomatoNumber+=timeslice.duration/tomatoFocusDuration
						if ((tomatoNumber-oldTomatoNumber)>=1){
						//达成一个tomato，单job时长可能小于一个tomatoFocusDuration
						//在tomatoJobs插入一个休息tomatoJob
							dc.minute=(tomatoNumber>=tomatoNumberPerLoop)?tomatoLongRestTime:tomatoShortRestTime
							let tomatoRest=`[tomatoRest(${dc.minute}m)]`
							timeslice=libTimer.getJobTimeslice(t.jobType,dc.minute,timeQuantums,false)
							//此处允许timeslice.duration===0,即时间不足可以不休息了
							if (timeslice.duration!==0){
								tomatoJob={
									taskId:t.taskId,
									taskName:tomatoRest+t.taskName,
									containingProject:t.containingProject,
									duration:timeslice.duration,
									start:timeslice.start,
									stop:timeslice.stop,
									jobType:t.jobType,
									implementStart:null,
									implementStop:null,
									runMode:null,
									runState:null
								}
								tomatoJobs.push(tomatoJob)
							}
							tomatoNumber=(tomatoNumber>=tomatoNumberPerLoop)?0:tomatoNumber	
							oldTomatoNumber=tomatoNumber			
						}
					}//else  分配时间成功
				}//while
			}//for
			preferences.write("tomatoJobs",tomatoJobs)
			preferences.write("availableJobs",availableJobs)
			//用availableJobs更新jobs并保存jobs
			let jobs=preferences.read("jobs")
			for (let i of availableJobs){
				for (let j of jobs){
					if (j.taskId===i.taskId){
						j.planRecords=i.planRecords
						j.scheduleStatus=i.scheduleStatus
					}
				}
			}
			preferences.write("jobs",jobs)	
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}	
	}
	
	
	libTimer.getStartSchedulingForTomorrowTime=function(){
		try{
			let cal = Calendar.current
			let now =new Date()
			let today = cal.startOfDay(now)
			let dc = new DateComponents()
			let startSchedulingForTomorrowStr=libTimer.getStartSchedulingForTomorrow()
			//let StartSchedulingForTomorrowPattern=new RegExp("^([2][0-3]):([0-5][0-9])$")
			if (StartSchedulingForTomorrowPattern.test(startSchedulingForTomorrowStr)){
				dc.hour=parseInt(RegExp.$1)
				dc.minute=parseInt(RegExp.$2)
				return cal.dateByAddingDateComponents(today,dc)
			}else{
				errMessage="startSchedulingForTomorrow参数未正确配置，,请先从自动化菜单的Smart Scheduling and Timing子菜单运行set Preferences动作。"
				throw new Error(errMessage)	
			}
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}	
	}



	libTimer.selectModeAndRunTimeArrangement=function(availableJobs){
		const timeQuantumNamesToInclude=[]
		const selectModeForm = new Form()
		const selectModePopupMenu = new Form.Field.Option(
			'selecteMode',
			'TimeArrangementMode/时间分配模式',
			['bySpecifiedTimeQuantums', 'byExcludePeriod', 'AllTimeQuantums'],
			['by specified time quantums/按指定时间段', 'by exclude period/按排除时间范围', 'all time quantums/全部时间段'],
			'AllTimeQuantums'
		)
		selectModeForm.addField(selectModePopupMenu)
		const selectModeFormPrompt = 'Which TimeArrangementMode/时间分配模式?'
		const selectModeFormPromise = selectModeForm.show(selectModeFormPrompt, 'Continue')
		
		let now = new Date()
		let cal = Calendar.current
		let today = cal.startOfDay(now)
		let dc = new DateComponents()	
		dc.minute=parseInt(libTimer.getTodayPlanTimeLead())
		let todayPlanTimeStartingPoint=cal.dateByAddingDateComponents(now,dc)
		dc.day = 1
		dc.minute=0
		let tomorrow = cal.dateByAddingDateComponents(today,dc)
		let todayTimeQuantums=libTimer.getTimeQuantums(today)
		let tomorrowTimeQuantums=libTimer.getTimeQuantums(tomorrow)
		let StartSchedulingForTomorrowTime=libTimer.getStartSchedulingForTomorrowTime()
		let timeQuantums=(now>StartSchedulingForTomorrowTime)?tomorrowTimeQuantums:todayTimeQuantums
		
		let timeQuantumNames=timeQuantums.map(t=>t.timeQuantumName)
		let timeQuantumNameAndStrs=timeQuantums.map(t=>t.timeQuantumName+"["+t.timeQuantumStr+"]")
		const selectByTimeQuantumsForm = new Form()
		const selectByTimeQuantumsTimeQuantumsField = new Form.Field.MultipleOptions(
			'timeQuantumNamesToInclude', 
			'timeQuantums To Include/包含的时间段', 
			timeQuantumNames, 
			timeQuantumNameAndStrs,
			timeQuantumNamesToInclude)
		selectByTimeQuantumsForm.addField(selectByTimeQuantumsTimeQuantumsField)
		const selectByTimeQuantumsFormPrompt = 'Select TimeQuantums:'
		
		const selectExcludePeriodForm = new Form()
		const startTimeField = new Form.Field.Date('startTime', 'Start', today)
		const endTimeField = new Form.Field.Date('endTime', 'End', today)
		selectExcludePeriodForm.addField(startTimeField)
		selectExcludePeriodForm.addField(endTimeField)
		const selectExcludePeriodPrompt = 'Select start and end times: '
				
		selectModeFormPromise.then(function (formObject) {
			const optionSelected = formObject.values.selecteMode
			let selectByTimeQuantumsFormPromise
			let selectExcludePeriodFormPromise
			let selectTimeQuantumNames
			let selectExcludePeriod
			console.log(`select ${optionSelected} Mode`)
			switch (optionSelected) {
			case 'bySpecifiedTimeQuantums':
				selectByTimeQuantumsFormPromise = selectByTimeQuantumsForm.show(
					selectByTimeQuantumsFormPrompt,'Continue')
				selectByTimeQuantumsForm.validate = function(formObject){
					selectTimeQuantumNames=formObject.values.timeQuantumNamesToInclude
					//let validation= selectTimeQuantumNames? true:false
					return !!selectTimeQuantumNames
				}
				selectByTimeQuantumsFormPromise.then(function (formObject) {
					selectTimeQuantumNames=formObject.values.timeQuantumNamesToInclude
					console.log(`selectTimeQuantumNames`,selectTimeQuantumNames)
					libTimer.doTimeArrangement(timeQuantums,optionSelected,availableJobs,selectTimeQuantumNames)
				})
				selectByTimeQuantumsFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'byExcludePeriod':
				selectExcludePeriodFormPromise = selectExcludePeriodForm.show(
					selectExcludePeriodPrompt,'Continue')
				selectExcludePeriodForm.validate = function(formObject){
					startDate = formObject.values.startTime
            		endDate = formObject.values.endTime
            		let excludePeriodDc=cal.dateComponentsBetweenDates(startDate,endDate)
            		let validation=(endDate>startDate) && excludePeriodDc.day===0 
            			&& excludePeriodDc.hour<=4
					return validation
				}
				selectExcludePeriodFormPromise.then(function (formObject) {
					selectExcludePeriod={
						startDate:formObject.values.startTime,
            			endDate:formObject.values.endTime
            		}
					console.log(`selectExcludePeriod`,selectExcludePeriod.startDate,selectExcludePeriod.endDate)
					libTimer.doTimeArrangement(timeQuantums,optionSelected,availableJobs,selectExcludePeriod)
				})
				selectExcludePeriodFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'AllTimeQuantums':
				libTimer.doTimeArrangement(timeQuantums,optionSelected,availableJobs,null)
				break
			default:
			}
		})

		selectModeFormPromise.catch(function (err) {
			console.log('form cancelled', err.message)
		})	
	
	}


	libTimer.getTimeQuantumsByExcludePeriod=function(timeQuantums,excludePeriod){
		try{
			let availableTimeQuantums=[]
			for (let tq of timeQuantums){
				switch(true){
					case tq.end < excludePeriod.startDate:
						availableTimeQuantums.push(tq)
						break
					case tq.start > excludePeriod.endDate:
						availableTimeQuantums.push(tq)
						break 
					case (tq.start < excludePeriod.startDate 
						&& tq.end > excludePeriod.startDate):
						tq.end=excludePeriod.startDate//改变终点位置
						availableTimeQuantums.push(tq)
						break
					case  (tq.start < excludePeriod.endDate 
						&& tq.end > excludePeriod.endDate):
						tq.vernierPosition=excludePeriod.endDate//改变游标位置
						availableTimeQuantums.push(tq)
						break
				}
			}
			if (availableTimeQuantums.length===0){
				let errMessage=`excludePeriod太长，今日已无有效时间段可供分配，请重新选择。\n`
				errMessage+=`excludePeriod:start=${excludePeriod.startDate},end=${excludePeriod.endDate}。`
				throw new Error(errMessage)
			}	
			return availableTimeQuantums
		}catch(err){
			new Alert(err.name, err.message).show()
		}
	}


	libTimer.doTimeArrangement=function(timeQuantums,runMode,availableJobs,optionDatas){
		let now = new Date()
		let cal = Calendar.current
		let today = cal.startOfDay(now)
		let dc = new DateComponents()	
		dc.minute=parseInt(libTimer.getTodayPlanTimeLead())
		let todayPlanTimeStartingPoint=cal.dateByAddingDateComponents(now,dc)
		dc.day = 1
		dc.minute=0
		let tomorrow = cal.dateByAddingDateComponents(today,dc)
		
		let StartSchedulingForTomorrowTime=libTimer.getStartSchedulingForTomorrowTime()
		let tomatoJobs=new Array()
		let timeStartingPoint=todayPlanTimeStartingPoint
		console.log(now-StartSchedulingForTomorrowTime)
		if ((now-StartSchedulingForTomorrowTime)>0){
			timeStartingPoint=tomorrow
		}

		let availableTimeQuantums=[]
		switch(runMode){
			case `bySpecifiedTimeQuantums`:
				availableTimeQuantums=timeQuantums.filter(t=>optionDatas.includes(t.timeQuantumName))
				console.log(`bySpecifiedTimeQuantums,availableTimeQuantums.length=${availableTimeQuantums.length}`)
				break;
			case `byExcludePeriod`:
				availableTimeQuantums=libTimer.getTimeQuantumsByExcludePeriod(timeQuantums,optionDatas)
				console.log(`byExcludePeriod,availableTimeQuantums.length=${availableTimeQuantums.length}`)
				break;
			case `AllTimeQuantums`:
				availableTimeQuantums=timeQuantums
				console.log(`AllTimeQuantums,availableTimeQuantums.length=${availableTimeQuantums.length}`)
				break;
		}
		console.log(`in doTimeArrangement:availableTimeQuantums.length=${availableTimeQuantums.length}`)
		libTimer.timeArrangementForJobs(timeStartingPoint,availableTimeQuantums,availableJobs,tomatoJobs);
		
		let jobs=preferences.read("jobs")
		let task
		jobs.forEach(j=>{//恢复以JSON形式保存到preferences后丢失的对象引用
			task=Task.byIdentifier(j.taskId)
			j.containingProject=task.containingProject
			j.parent=task.parent
			j.tags=task.tags
		})

		tomatoJobs=preferences.read("tomatoJobs")//重要！！！函数传参在传数组时不是传的引用
		tomatoJobs.forEach(t=>{//恢复以JSON形式保存到preferences后丢失的对象引用
			task=Task.byIdentifier(t.taskId)
			t.containingProject=task.containingProject
		})
		
		let jobsNumberStr=`待分配availableJobs共有 ${availableJobs.length} 个，jobs共有 ${jobs.length} 个。`
		console.log(`[in timeArrangement] `+jobsNumberStr)
		let j=0
		let parentTaskStr
		let taskParent
		for (let job of jobs){
			let message=`job`+libTimer.getRecordStr(j,job,`taskName`)
			console.log(message)
			j++
		}
		
		let tomatoJobsLength=tomatoJobs.length
		let tomatoJobsNumberStr=`安排番茄钟执行任务tomatoJobs：共 ${tomatoJobsLength} 个。`
		console.log(`[in timeArrangement] `+tomatoJobsNumberStr)
		for(let i=0;i<tomatoJobsLength;i++){
			let message=`tomatoJob`+libTimer.getRecordStr(i,tomatoJobs[i],`taskName`)
			console.log(message)
		}
		
		let title=`“time arrangement”执行完毕`
		let message=`当前执行的时间分配模式是：${runMode}。\n`
		message+=jobsNumberStr+tomatoJobsNumberStr+`\n\n`
		if (tomatoJobsLength>0){
			message+=`第一个待执行的番茄钟任务是：\n`
			message+=`taskId=${tomatoJobs[0].taskId},${tomatoJobs[0].containingProject}/${tomatoJobs[0].taskName},duration=${tomatoJobs[0].duration},`
			message+=`start=${tomatoJobs[0].start},stop=${tomatoJobs[0].stop},jobType=${tomatoJobs[0].jobType}.\n\n`
		}
		message+=`可打开控制台查看更详细的log信息。\n\n`
		message+=`可从自动化菜单的Smart Scheduling and Timing子菜单运行start tomato clock动作开始按计划好的时间安排执行计时任务。执行中可随时通过stop tomato clock动作中止计时，并在调整优化后再次执行。\n\n`
		message+=`根据运行该动作的时间不同，系统会自动决定是安排今日时间还是明日时间，由preferences参数startSchedulingForTomorrow决定。`
		new Alert(title,message).show()
	}


	libTimer.getParentTaskStr=function(recordObj){
		let parentTaskStr=``
		let taskParent=recordObj.parent
		while (taskParent){
			parentTaskStr=`${taskParent}/`+parentTaskStr
			taskParent=taskParent.parent
		}
		parentTaskStr=parentTaskStr.replace(/\/$/g,``)
		return parentTaskStr
	}


	libTimer.tomatoStartProcess=async function(tomatoJob){
		try{
			let now=new Date()
			tomatoJob.implementStart=now
			
			let availableTomatoJobs=preferences.read("availableTomatoJobs")
			availableTomatoJobs.forEach((j)=>{
				if (j.taskId===tomatoJob.taskId && j.start===tomatoJob.start) {
					j.implementStart=now//更新tomatoJob执行记录
				}})
			preferences.write("availableTomatoJobs",availableTomatoJobs)
			
			let tomatoJobs=preferences.read("tomatoJobs")
			tomatoJobs.forEach((j)=>{
				if (j.taskId===tomatoJob.taskId && j.start===tomatoJob.start) {
					j.implementStart=now//更新tomatoJob执行记录
				}})
			preferences.write("tomatoJobs",tomatoJobs)
		
			let jobs=preferences.read("jobs")
			let implementRecord={}
			jobs.forEach((j)=>{
				if (j.taskId===tomatoJob.taskId) {//更新job执行记录
					j.scheduleStatus=3
					implementRecord={
						start:now,
						stop:null,
						runMode:tomatoJob.runMode
					}
					j.implementRecords.push(implementRecord)
				}})
			preferences.write("jobs",jobs)
		
			let task=Task.byIdentifier(tomatoJob.taskId)
			//console.log(`do tomatoStartProcess for task:Id=${tomatoJob.taskId},[${tomatoJob.jobType}]/${task.containingProject}/${task.name} at:${now}`)
	
			libTimer.toggleTag(task,"Scheduling|调度","Running")
			libTimer.toggleTag(task,"Timer|计时","Timing")
			libTimer.toggleTag(task,"Kanban","In Progress")
			await libTimer.storeToTask(task, libTimer.key('start'), now)
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}
	}


	libTimer.tomatoEndUpdateProcess=async function(task,jobTaskName,caller){
		const endDate=new Date()
		let availableTomatoJobs=preferences.read("availableTomatoJobs")
		availableTomatoJobs.forEach((j)=>{
			if (j.taskId===task.id.primaryKey && j.taskName===jobTaskName){
				j.implementStop=endDate
				j.runState=(caller==="stopTomatoClock")?false:true
			}})
		preferences.write("availableTomatoJobs",availableTomatoJobs)
		
		let tomatoJobs=preferences.read("tomatoJobs")
		tomatoJobs.forEach((j)=>{
			if (j.taskId===task.id.primaryKey && j.taskName===jobTaskName){
				j.implementStop=endDate
				j.runState=(caller==="stopTomatoClock")?false:true
			}})
		preferences.write("atomatoJobs",tomatoJobs)
		
		let jobs=preferences.read("jobs")
		jobs.forEach((j)=>{
			if (j.taskId===task.id.primaryKey){//更新job执行记录
				j.scheduleStatus=4
				let i=j.implementRecords.length
				if (i>0){
					j.implementRecords[i-1].stop=endDate
				}else{
					console.log(`Error: jobs中taskId=${j.taskId}的任务无实际执行的记录(implementRecords)。`)
				}				
			}})
		preferences.write("jobs",jobs)
	
		let timerTagName=(caller==="stopTomatoClock")?"Abort":"Timed"
		libTimer.toggleTag(task,"Scheduling|调度","Finished")
		libTimer.toggleTag(task,"Timer|计时",timerTagName)
		libTimer.toggleTag(task,"Kanban","In Progress")
	
		const startDateStr=await libTimer.getFromTask(task, libTimer.key('start'));
		const startDate = new Date(startDateStr)
		const timeSpent = (endDate-startDate)/60000  //ms->minutes

		await libTimer.removeFromTask(task, libTimer.key('start'))

		let timeLogs = await libTimer.getFromTask(task, libTimer.key('timeLogs'));
		if (timeLogs===undefined) timeLogs=[]
		let timeLog={
			serialNumber:timeLogs.length,
			start:startDate,
			end:endDate,
			timeSpentInMinutes:timeSpent
		}
		timeLogs.push(timeLog)

		let totalTimeSpentInMinutes=timeLogs.reduce((prev,cur)=>{
			prev+=cur.timeSpentInMinutes
			return prev},0)	
					
		await libTimer.storeToTask(task, 
			libTimer.key('totalTimeSpentInMinutes'), totalTimeSpentInMinutes)
		await libTimer.storeToTask(task, libTimer.key('timeLogs'), timeLogs)
		await libTimer.updateCompletedProgress(task,totalTimeSpentInMinutes)
	}


	libTimer.tomatoTimeOutProcess=async function(){
		try{
			let now=new Date()
			console.log(`tomato: [${tomatoTracker.jobType}]/${tomatoTracker.project}/${tomatoTracker.taskName},taskId=${tomatoTracker.taskId},finished at:${now}`)
			if (app.platformName==="macOS"){
				let appName = app.name
				let resourceFolder = URL.fromPath(`/Applications/${appName}.app/Contents/Resources/`, true)
				let soundFile=libTimer.getTomatoSoundFile()
				let soundFileURL = URL.fromString(resourceFolder.string + soundFile)
				let audioAlert = new Audio.Alert(soundFileURL)
				Audio.playAlert(audioAlert)
			}
		
			let title="⏱️ tomato Tracker"
			let message=`taskId=${tomatoTracker.taskId}\n`
			message+=`taskName=${tomatoTracker.taskName}\n`
			message+=`project=${tomatoTracker.project}\n`
			message+=`jobType=${tomatoTracker.jobType}\n\n`
	
			if (tomatoRestPattern.test(tomatoTracker.taskName)){
				message+="🏁 Rest timeout.Let's go on. 🏝"
			}else{
				message+="🏁 Focus timeout.Take a rest. 🏝"
			}
			new Alert(title,message).show()
		
			let task=Task.byIdentifier(tomatoTracker.taskId)
			now=new Date()
			//console.log(`do tomatoTimeoutProcess for task:Id=${tomatoTracker.taskId},[${tomatoTracker.jobType}]/${task.containingProject}/${task.name}, at:${now}`)
			await libTimer.tomatoEndUpdateProcess(task,tomatoTracker.taskName,"tomatoTimeOutProcess")
			
			tomatoTracker.timer.cancel()
			tomatoTracker.timer = null
			let returnObj=generatorTomatoJobObj.next()
			if (returnObj.value!==undefined){
				await libTimer.doTomatoJob(returnObj.value)
			}
			if 	(returnObj.done){//所选运行模式的tomatoJobs处理完成
				libTimer.tomatoJobsCompleteProcess()
			}
		}
		catch(err){
			new Alert(err.name, err.message).show()
			libTimer.saveAvailableTomatoJobsToTomatoJobs()
		}
	}


	libTimer.doTomatoJob=async function(tomatoJob){
		try{
			let tomatoLongRestTime=libTimer.getTomatoLongRestTime()
			let tomatoShortRestTime=libTimer.getTomatoShortRestTime()
			let todayPlanTimeLead=libTimer.getTodayPlanTimeLead()
			let startTime=new Date(tomatoJob.start)
			let stopTime=new Date(tomatoJob.stop)

			let cal = Calendar.current
			let dc = new DateComponents()
			let now = new Date()
			dc.minute=parseInt(tomatoShortRestTime)
			let atLatestTime=cal.dateByAddingDateComponents(startTime,dc)
			dc.minute=0-parseInt(todayPlanTimeLead)
			let earliestStartTime=cal.dateByAddingDateComponents(now,dc)

			let errMessage=""
			let title=""
			let message=""
			
			if (tomatoJob.runMode==="fullAutomation"){//其它运行模式不检查时间
				switch (true){
					case stopTime<now:
						errMessage=`tomato: [${tomatoJob.jobType}]/${tomatoJob.containingProject}/${tomatoJob.taskName},taskId=${tomatoJob.taskId}\n`
						errMessage+=`stop=${tomatoJob.stop},now=${now},stop<now,无法执行tomato.\n\n`
						errMessage+=`请从自动化菜单的Smart Scheduling and Timing子菜单运行time arrangement动作重新安排时间计划。`
						throw new Error(errMessage)
						break
					case startTime<earliestStartTime:
						errMessage=`tomato: [${tomatoJob.jobType}]/${tomatoJob.containingProject}/${tomatoJob.taskName},taskId=${tomatoJob.taskId}\n`
						errMessage+=`start=${tomatoJob.start},now=${now},start<now-允许提前启动时间量(todayPlanTimeLead).\n\n`
						errMessage+=`请从自动化菜单的Smart Scheduling and Timing子菜单运行time arrangement动作重新安排时间计划。`
						throw new Error(errMessage)
						break
					case atLatestTime<now:
						errMessage=`tomato: [${tomatoJob.jobType}]/${tomatoJob.containingProject}/${tomatoJob.taskName},taskId=${tomatoJob.taskId}\n`
						errMessage+=`start=${tomatoJob.start},now=${now},start+允许最晚启动时间量(取tomatoShortRestTime值)<now.\n\n`
						errMessage+=`请从自动化菜单的Smart Scheduling and Timing子菜单运行time arrangement动作重新安排时间计划。`
						throw new Error(errMessage)
						break		
					case startTime<now:
						title=`tomato启动时间早于当前时间`
						message=`tomato: [${tomatoJob.jobType}]/${tomatoJob.containingProject}/${tomatoJob.taskName},taskId=${tomatoJob.taskId}\n`
						message+=`start=${tomatoJob.start},now=${now},start<now，该tomato实际执行将变短。\n\n`
						new Alert(title,message).show()
						break
					case startTime>now:
						title=`tomato启动时间晚于当前时间`
						message=`tomato: [${tomatoJob.jobType}]/${tomatoJob.containingProject}/${tomatoJob.taskName},taskId=${tomatoJob.taskId}\n`
						message+=`start=${tomatoJob.start},now=${now},start>now，该tomato实际执行将变长。\n\n`
						new Alert(title,message).show()
						break
				}
			}
			
			console.log(`tomato: [${tomatoJob.jobType}]/${tomatoJob.containingProject}/${tomatoJob.taskName},taskId=${tomatoJob.taskId},started at:${now}`)
			await libTimer.tomatoStartProcess(tomatoJob)
			
			let acceleratedTestMode=libTimer.getAcceleratedTestMode()
			if (acceleratedTestMode){//开发测试用
				tomatoTracker.durationInSec=parseInt(libTimer.getAcceleratedTestModeTomatoDurationInSec())
			}else{ //正式生产用
				tomatoTracker.durationInSec=parseInt((stopTime-now)/1000)
			}
			tomatoTracker.taskId=tomatoJob.taskId
			tomatoTracker.taskName=tomatoJob.taskName
			tomatoTracker.project=tomatoJob.containingProject
			tomatoTracker.jobType=tomatoJob.jobType
			tomatoTracker.timer = Timer.once(tomatoTracker.durationInSec, function(timer){
				libTimer.tomatoTimeOutProcess()})
			
		}
		catch(err){
			new Alert(err.name, err.message).show()
			libTimer.saveAvailableTomatoJobsToTomatoJobs()	
		}
	}
	
	
	libTimer.generatorTomatoJob=function*(tomatoJobs){
		try{
			yield*  tomatoJobs
			// for (let t of tomatoJobs){
// 				yield t
// 			}
		}catch(err){
			new Alert(err.name, err.message).show()	
		}		
	}
	
	
	libTimer.saveAvailableTomatoJobsToTomatoJobs=function(){
		//将availableTomatoJobs的执行时间数据保存到tomatoJobs
		let tomatoJobs=preferences.read("tomatoJobs")
		let availableTomatoJobs=preferences.read("availableTomatoJobs")
		for (let i of availableTomatoJobs){
			for (let j of tomatoJobs){
				if (i.taskId===j.taskId && i.start===j.start){//一个taskId可能有多个tomatojob任务
					j.implementStart=i.implementStart
					j.implementStop=i.implementStop
					j.runMode=i.runMode
					j.runState=i.runState
				}
			}
		}
		preferences.write("tomatoJobs",tomatoJobs)
	}
	
	
	
	libTimer.tomatoJobsCompleteProcess=function(){
		libTimer.saveAvailableTomatoJobsToTomatoJobs()
	
		let title=`全部tomato任务处理完毕`
		let message=`恭喜您！您选择的运行模式的所有tomato任务都已处理完毕。\n\n`
		message+=`日事日清，日清日高。`
		console.log(message)
		new Alert(title,message).show()
	}
	
	
	libTimer.executeTomatoJobs=async function(tomatoJobs){
		try{
			generatorTomatoJobObj=libTimer.generatorTomatoJob(tomatoJobs)//声明生成器全局变量对象
			let returnObj=generatorTomatoJobObj.next()
			if (returnObj.value===undefined){
				let errMessage=`in function “libTimer.executeTomatoJobs”：generatorTomatoJobObj返回值为undefined。`
				throw new Error(errMessage)
			}else{
				await libTimer.doTomatoJob(returnObj.value)
			}
			if 	(returnObj.done){
				libTimer.tomatoJobsCompleteProcess()
			}
		}	
		catch(err){
			new Alert(err.name, err.message).show()
		}		
	}

	
	libTimer.selectModeAndRunTomatoTiming =function(tomatoJobs){
		const jobTypesToInclude=[]
		const taskIdsToInclude=[]
		const selectModeForm = new Form()
		const selectModePopupMenu = new Form.Field.Option(
			'selecteMode',
			'TomatoTimingMode/番茄计时模式',
			['byJobType', 'bySpecifiedTask', 'fullAutomation'],
			['by job type/按任务类型', 'by specified task/按指定task', 'full automation/全自动化'],
			'fullAutomation'
		)
		selectModeForm.addField(selectModePopupMenu)
		const selectModeFormPrompt = 'Which TomatoTimingMode/番茄计时模式?'
		const selectModeFormPromise = selectModeForm.show(selectModeFormPrompt, 'Continue')
		
		
		let jobTypes=tomatoJobs.map(tomatoJob=>{return tomatoJob.jobType})
		let jobTypeSet=new Set(jobTypes)
		jobTypes=Array.from(jobTypeSet)//去重
		
		const selectByJobTypeForm = new Form()
		const selectByJobTypeJobTypeField = new Form.Field.MultipleOptions('jobTypesToInclude', 'jobTypes To Include/包含的作业(任务)类型', jobTypes, jobTypes,jobTypesToInclude)
		selectByJobTypeForm.addField(selectByJobTypeJobTypeField)
		const selectByJobTypeFormPrompt = 'Select JobTypes:'
		
		let specifiedTaskIds=tomatoJobs.map(tomatoJob=>{return tomatoJob.taskId})
		let specifiedTaskIdsSet=new Set(specifiedTaskIds)
		specifiedTaskIds=Array.from(specifiedTaskIdsSet)//去重
		let specifiedTaskNames=tomatoJobs.map(tomatoJob=>{return tomatoJob.taskName})
		let specifiedTaskNamesSet=new Set(specifiedTaskNames)
		specifiedTaskNames=Array.from(specifiedTaskNamesSet)//去重
		
		const selectBySpecifiedTaskForm = new Form()
		const selectBySpecifiedTaskTaskField = new Form.Field.MultipleOptions('taskIdsToInclude', 'tasks To Include/包含的Tasks', specifiedTaskIds, specifiedTaskNames,taskIdsToInclude)
		selectBySpecifiedTaskForm.addField(selectBySpecifiedTaskTaskField)
		const selectBySpecifiedTaskFormPrompt = 'Select Tasks:'
				
		selectModeFormPromise.then(function (formObject) {
			const optionSelected = formObject.values.selecteMode
			let selectByJobTypeFormPromise
			let selectBySpecifiedTaskFormPromise
			let selectJobTypes
			let selectTaskIds
			switch (optionSelected) {
			case 'byJobType':
				console.log(`select byJobType Mode`)
				selectByJobTypeFormPromise = selectByJobTypeForm.show(
					selectByJobTypeFormPrompt,'Continue')
				selectByJobTypeForm.validate = function(formObject){
					selectJobTypes=formObject.values.jobTypesToInclude
					let validation=selectJobTypes.length>0
					return validation
				}
				selectByJobTypeFormPromise.then(function (formObject) {
					selectJobTypes = formObject.values.jobTypesToInclude
					console.log(selectJobTypes)
					libTimer.doTomatoTimer(optionSelected,tomatoJobs,selectJobTypes)
				})
				selectByJobTypeFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'bySpecifiedTask':
				console.log(`select bySpecifiedTask Mode`)
				selectBySpecifiedTaskFormPromise = selectBySpecifiedTaskForm.show(
					selectBySpecifiedTaskFormPrompt,'Continue')
				selectBySpecifiedTaskForm.validate = function(formObject){
					selectTaskIds=formObject.values.taskIdsToInclude
					let validation=selectTaskIds.length>0
					return validation
				}
				selectBySpecifiedTaskFormPromise.then(function (formObject) {
					selectTaskIds = formObject.values.taskIdsToInclude
					console.log(selectTaskIds)
					libTimer.doTomatoTimer(optionSelected,tomatoJobs,selectTaskIds)
				})
				selectBySpecifiedTaskFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'fullAutomation':
				console.log(`select fullAutomation Mode`)
				libTimer.doTomatoTimer(optionSelected,tomatoJobs,null)
				break
			default:
			}
		})

		selectModeFormPromise.catch(function (err) {
			console.log('form cancelled', err.message)
		})
	}
	
	
	
	libTimer.doTomatoTimer=function(runMode,tomatoJobs,optionDatas){
		console.log(`doTomatoTimer:runMode=${runMode},optionDatas=${optionDatas}`)
		let availableTomatoJobs
		switch(runMode){
			case 'byJobType':
				availableTomatoJobs=tomatoJobs.filter(t=>optionDatas.includes(t.jobType))
				break
			case 'bySpecifiedTask':
				availableTomatoJobs=tomatoJobs.filter(t=>optionDatas.includes(t.taskId))
				break
			case 'fullAutomation':
				availableTomatoJobs=tomatoJobs
				break
		}
		if (availableTomatoJobs.length===0){
			let errMessage=`runMode=${runMode},optionDatas=${optionDatas},no matched tomatoJobs(tasks)。`
			throw new Error(errMessage)
		}
		
		availableTomatoJobs.forEach(t=>t.runMode=runMode)
		preferences.write("availableTomatoJobs",availableTomatoJobs)
		
		let inputForm = new Form()
			inputForm.addField(new Form.Field.Option(
				'tomatoJob',
				'tomato job to do',
				availableTomatoJobs,
				availableTomatoJobs.map(t => t.taskName),
				availableTomatoJobs[0]))
			inputForm.addField(new Form.Field.String(
				"duration",
				"tomato duration",
				availableTomatoJobs[0].duration))
			inputForm.addField(new Form.Field.String(
				"start",
				"tomato start time",
				availableTomatoJobs[0].start))
			inputForm.addField(new Form.Field.String(
				"stop",
				"tomato stop time",
				availableTomatoJobs[0].stop))
			inputForm.addField(new Form.Field.String(
				"jobType",
				"tomato jobType",
				availableTomatoJobs[0].jobType))
		
			let formPrompt = "请点击Continue按钮开始执行tomato任务:"
			let formPromise = inputForm.show(formPrompt,"Continue")
		
			inputForm.validate = function(formObject){
				let t=formObject.values["tomatoJob"]
				let validation=(t===availableTomatoJobs[0])

 				if (!validation){
					inputForm.removeField(inputForm.fields[4])
					inputForm.removeField(inputForm.fields[3])
					inputForm.removeField(inputForm.fields[2])
					inputForm.removeField(inputForm.fields[1])
					
					inputForm.addField(new Form.Field.String(
						"duration",
						"tomato duration",
						t.duration))
					inputForm.addField(new Form.Field.String(
						"start",
						"tomato start time",
						t.start))
					inputForm.addField(new Form.Field.String(
						"stop",
						"tomato stop time",
						t.stop))
					inputForm.addField(new Form.Field.String(
						"jobType",
						"tomato jobType",
						t.jobType))
					throw new Error("温馨提示：可查看其它任务的属性，但只能选择从第一个任务开始执行。")
				}
				return validation
			}
		
			formPromise.then(function(formObject){
				try {
					let t=formObject.values["tomatoJob"]	
					let title=`开始按${runMode}模式程序执行tomato任务`
					let message=`tomato:task=${t.containingProject}/${t.taskName},duration=${t.duration},start=${t.start},stop=${t.stop},jobType=${t.jobType}\n\n`
					message+=`系统已经在后台开始计时，请放心进入tomato专注模式，enjoy your every task！每个tomato时钟到时，系统会弹窗提醒，在macOS上系统还将播放声音提醒您。\n\n`
					message+=`执行过程中有需要可随时通过自动化菜单的Smart Scheduling and Timing子菜单运行stop tomato clock动作来中止当前执行的tomato任务。\n\n`
					console.log(title,message)
					new Alert(title,message).show()
					libTimer.executeTomatoJobs(availableTomatoJobs)
				}
				catch(err){
					console.error(err)
				}
			})
		
			formPromise.catch(function(err){
				console.log("form cancelled", err.message)
			})
			
			formPromise.finally(()=>{
				//console.log(`[in libTimer.doTomatoTimer]formPromise.finally process: can do something。`)
			})
	}
	
	
	libTimer.selectModeAndRunOutputTimeData =function(table){
		const jobTypesToInclude=[]
		const projectsToInclude=[]
		const taskIdsToInclude=[]
		const selectModeForm = new Form()
		const selectModePopupMenu = new Form.Field.Option(
			'selecteMode',
			'outputTimeDataMode/输出时间数据模式',
			['byJobTypes','bySpecifiedProjects', 'bySpecifiedTasks', 'All'],
			['by job types/按任务类型', 'by specified projects/按指定projects','by specified tasks/按指定tasks', 'All/全部'],
			'All'
		)
		selectModeForm.addField(selectModePopupMenu)
		const selectModeFormPrompt = 'Which outputTimeDataMode/输出时间数据模式?'
		const selectModeFormPromise = selectModeForm.show(selectModeFormPrompt, 'Continue')
		
		
		let jobTypes=table.map(job=>{return job.jobType})
		let jobTypeSet=new Set(jobTypes)
		jobTypes=Array.from(jobTypeSet)//去重
		
		const selectByJobTypeForm = new Form()
		const selectByJobTypeJobTypeField = new Form.Field.MultipleOptions('jobTypesToInclude', 'jobTypes To Include/包含的作业(任务)类型', jobTypes, jobTypes,jobTypesToInclude)
		selectByJobTypeForm.addField(selectByJobTypeJobTypeField)
		const selectByJobTypeFormPrompt = 'Select JobTypes:'
		
		let specifiedProjects=table.map(job=>{return job.containingProject})
		let specifiedProjectsSet=new Set(specifiedProjects)
		specifiedProjects=Array.from(specifiedProjectsSet)//去重
		let specifiedProjectNames=specifiedProjects.map(project=>{return project.name})
		
		const selectBySpecifiedProjectForm = new Form()
		const selectBySpecifiedProjectProjectField = new Form.Field.MultipleOptions('projectsToInclude', 'projects To Include/包含的Projects', specifiedProjects, specifiedProjectNames,projectsToInclude)
		selectBySpecifiedProjectForm.addField(selectBySpecifiedProjectProjectField)
		const selectBySpecifiedProjectFormPrompt = 'Select Projects:'
		
		
		let specifiedTaskIds=table.map(job=>{return job.taskId})
		let specifiedTaskIdsSet=new Set(specifiedTaskIds)
		specifiedTaskIds=Array.from(specifiedTaskIdsSet)//去重
		let specifiedTaskNames=table.map(job=>{return job.taskName})
		let specifiedTaskNamesSet=new Set(specifiedTaskNames)
		specifiedTaskNames=Array.from(specifiedTaskNamesSet)//去重
		
		const selectBySpecifiedTaskForm = new Form()
		const selectBySpecifiedTaskTaskField = new Form.Field.MultipleOptions('taskIdsToInclude', 'tasks To Include/包含的Tasks', specifiedTaskIds, specifiedTaskNames,taskIdsToInclude)
		selectBySpecifiedTaskForm.addField(selectBySpecifiedTaskTaskField)
		const selectBySpecifiedTaskFormPrompt = 'Select Tasks:'
				
		selectModeFormPromise.then(function (formObject) {
			const optionSelected = formObject.values.selecteMode
			let selectByJobTypeFormPromise
			let selectBySpecifiedTaskFormPromise
			let selectJobTypes
			let selectTaskIds
			switch (optionSelected) {
			case 'byJobTypes':
				console.log(`select byJobTypes Mode`)
				selectByJobTypeFormPromise = selectByJobTypeForm.show(
					selectByJobTypeFormPrompt,'Continue')
				selectByJobTypeForm.validate = function(formObject){
					selectJobTypes=formObject.values.jobTypesToInclude
					let validation=selectJobTypes.length>0
					return validation
				}
				selectByJobTypeFormPromise.then(function (formObject) {
					selectJobTypes = formObject.values.jobTypesToInclude
					console.log(selectJobTypes)
					libTimer.doOutputTimeData(optionSelected,table,selectJobTypes)
				})
				selectByJobTypeFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'bySpecifiedProjects':
				console.log(`select bySpecifiedProjects Mode`)
				selectBySpecifiedProjectFormPromise = selectBySpecifiedProjectForm.show(
					selectBySpecifiedTaskFormPrompt,'Continue')
				selectBySpecifiedProjectForm.validate = function(formObject){
					selectProjects=formObject.values.projectsToInclude
					let validation=selectProjects.length>0
					return validation
				}
				selectBySpecifiedProjectFormPromise.then(function (formObject) {
					selectProjects=formObject.values.projectsToInclude
					console.log(selectProjects)
					libTimer.doOutputTimeData(optionSelected,table,selectProjects)
				})
				selectBySpecifiedProjectFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'bySpecifiedTasks':
				console.log(`select bySpecifiedTasks Mode`)
				selectBySpecifiedTaskFormPromise = selectBySpecifiedTaskForm.show(
					selectBySpecifiedTaskFormPrompt,'Continue')
				selectBySpecifiedTaskForm.validate = function(formObject){
					selectTaskIds=formObject.values.taskIdsToInclude
					let validation=selectTaskIds.length>0
					return validation
				}
				selectBySpecifiedTaskFormPromise.then(function (formObject) {
					selectTaskIds = formObject.values.taskIdsToInclude
					console.log(selectTaskIds)
					libTimer.doOutputTimeData(optionSelected,table,selectTaskIds)
				})
				selectBySpecifiedTaskFormPromise.catch(function (err) {
					console.log('form cancelled', err.message)
				})
				break
			case 'All':
				console.log(`select All Mode`)
				libTimer.doOutputTimeData(optionSelected,table,null)
				break
			default:
			}
		})

		selectModeFormPromise.catch(function (err) {
			console.log('form cancelled', err.message)
		})
	}

	
	libTimer.doOutputTimeData=async function(runMode,table,optionDatas){
		try{
			console.log(`doOutputTimeData:runMode=${runMode},optionDatas=${optionDatas}`)
			
			let dataSource
			switch(runMode){
				case 'byJobTypes':
					dataSource=table.filter(j=>optionDatas.includes(j.jobType))
					break
				case 'bySpecifiedProjects':
					dataSource=table.filter(j=>optionDatas.includes(j.containingProject))
					break
				case 'bySpecifiedTasks':
					dataSource=table.filter(j=>optionDatas.includes(j.taskId))
					break
				case `All`:
					dataSource=table
					break
			}
			
			const selectOutputTargetForm = new Form()
			const selectOutputTargetPopupMenu = new Form.Field.Option(
				'selecteOutputTarget',
				'outputTarget/输出目标',
				['Drafts','DayOne', `Obsidian`,'Cliborad'],
				['to Drafts App','to DayOne App',`to Obsidian App`,`to Cliborad/剪贴板`],
				'Cliborad'
			)
			selectOutputTargetForm.addField(selectOutputTargetPopupMenu)
			const selectOutputTargetFormPrompt = 'Which outputTarget/输出目标?'
			const selectOutputTargetFormPromise = selectOutputTargetForm.show(selectOutputTargetFormPrompt, 'Continue')
	
			selectOutputTargetFormPromise.then(function (formObject) {
				const outputTarget = formObject.values.selecteOutputTarget
				console.log(`outputTarget=${outputTarget}`)
				let urlTemplate=``
				switch(outputTarget){
					case 'Drafts':
						urlTemplate = 'drafts5://create?text={{CONTEXT}}'
						break
					case 'DayOne':
						urlTemplate = `dayone://post?entry={{CONTEXT}}&journal={{NOTETITLE}}`
						break
					case 'Obsidian':
						urlTemplate = `obsidian://new?vault={{VAULT}}&file={{FILEPATH}}{{NOTETITLE}}&content={{HEADER}}%0A%0A{{CONTEXT}}`
						break
					case 'Cliborad':
						urlTemplate = 'CLIPBOARD'
						break
				}
				libTimer.doOutputProcess(dataSource,urlTemplate)	
			})
		
			selectOutputTargetFormPromise.catch(function (err) {
				console.log('form cancelled', err.message)
			})
		}catch(err){
			new Alert(err.name, err.message).show()	
		}	
	}
	
	
	libTimer.makeDateHeading=function(planDate,implementDate){
    	let headingString =`# Task/Job Process Records \n`+
			'## plan date: ' + planDate + `\n`+
			'## implement date: ' + implementDate + `\n`
		return headingString
	}
	
	
	libTimer.getDateString=function(date){
		const year = date.getFullYear().toString().padStart(4, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		let dateString=`D`+year+`-`+month+`-`+day
		console.log(`dateString=${dateString}`)
		return dataString
	}
	
	
	
	libTimer.getPlanDate=function(dataRecord){
		let planDate=null
		for (let key in dataRecord){
			if (key===`start`){//tomatoJobs记录的start
				planDate=dataRecord[key]
				break
			}
			if (key===`planRecords` && dataRecord[key].length>0){//jobs记录的planRecords
				planDate=dataRecord[key][0].start
				break
			}
		}
		if (planDate){
			let date=new Date(planDate)
			const year = date.getFullYear().toString().padStart(4, '0');
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			let dateString=year+`-`+month+`-`+day
			return dateString
		}
		return planDate
	}
	
	
	libTimer.getImplementDate=function(dataRecord){
		let implementDate=null
		for (let key in dataRecord){
			if (key===`implementStart`){//tomatoJobs记录的implementStart
				implementDate=dataRecord[key]
				break
			}
			if (key===`implementRecords` && dataRecord[key].length>0){//jobs记录的implementRecords
				implementDate=dataRecord[key][0].start
				break
			}
		}
		if (implementDate){
			let date=new Date(implementDate)
			const year = date.getFullYear().toString().padStart(4, '0');
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			let dateString=year+`-`+month+`-`+day
			return dateString
		}
		return implementDate
	}
	
		
	
	libTimer.doOutputProcess=function(dataSource,urlTemplate){
		console.log(`dataSource:`)
		dataSource.forEach(j=>console.log(`taskId=${j.taskId},taskName=${j.taskName},project=${j.containingProject}`))
		console.log(`urlTemplate=${urlTemplate}`)
		
		let planDate=libTimer.getPlanDate(dataSource[0])
		let implementDate=libTimer.getImplementDate(dataSource[0])
		console.log(`planDate=${planDate},implementDate=${implementDate}`)
		const heading = libTimer.makeDateHeading(planDate,implementDate)
		console.log(heading)

		const markdown = libTimer.getMarkdownReport(heading,dataSource)
		console.log(markdown)

		if (urlTemplate === 'CLIPBOARD') {
			Pasteboard.general.string = markdown
			let title='output Done!｜输出完毕'
			let message='Task/Job data has been copied to the clipboard.｜Task/Job数据已输出至剪贴板。'
			new Alert(title,message).show()
		} else {
			let vaultTitle =``
			let filePathBaseOnVault =``
			if (app.platformName==="iOS"){
				vaultTitle = libTimer.getIOSObsidianVaultTitle()
				filePathBaseOnVault = libTimer.getIOSObsidianFilePathBaseOnVault()
			}else{
				vaultTitle = libTimer.getMacOSObsidianVaultTitle()
				filePathBaseOnVault = libTimer.getMacOSObsidianFilePathBaseOnVault()
			}
			if (!vaultTitle || vaultTitle === ""){
				throw {
					name: "Undeclared Vault Preference",
					message: "A default Obsidian vault has not yet been indicated for this plug-in.\n\n请运行本插件的set preferences动作进行设置."
				}
			}
			console.log("vaultTitle: ", vaultTitle)
			
			if (!filePathBaseOnVault || filePathBaseOnVault === ""){
				throw {
					name: "Undeclared filePathBaseOnVault Preference",
					message: "A default Obsidian file path base on vault has not yet been indicated for this plug-in.\n\n请运行本插件的set preferences动作进行设置."
				}
			}
			console.log("filePathBaseOnVault: ", filePathBaseOnVault)
		
			let journalNamePrefix = libTimer.getOutputJournalNamePrefix()
			if (!journalNamePrefix || journalNamePrefix === ""){
				throw {
					name: "Undeclared JournalNamePrefix Preference",
					message: "A default output Journal Name Prefix has not yet been indicated for this plug-in.\n\n请运行本插件的set preferences动作进行设置."
				}
			}
			console.log("output Journal Name Prefix: ", journalNamePrefix)
			let noteTitle=journalNamePrefix+`-`+implementDate
			let YAMLheader=`---\nplan date: [[${planDate}]]\nimplement Date: [[${implementDate}]]\nfrom: omnifocus smartSchedulingAndTiming plug-in\n---`
	
			let targetUrl= urlTemplate.replace('{{VAULT}}', encodeURIComponent(vaultTitle))
			targetUrl= targetUrl.replace('{{FILEPATH}}', encodeURIComponent(filePathBaseOnVault))
			targetUrl= targetUrl.replace('{{NOTETITLE}}', encodeURIComponent(noteTitle))
			targetUrl = targetUrl.replace('{{HEADER}}', encodeURIComponent(YAMLheader))
		    targetUrl = targetUrl.replace('{{CONTEXT}}', encodeURIComponent(markdown))
		    URL.fromString(targetUrl).call(() => {})
		}
	}
		
	
	libTimer.getMarkdownReport=function(heading,dataSource){
		let markdown = heading+`\n`
		let recordCounter=1
		dataSource.forEach(function (recordObj) {
			markdown=markdown.concat(libTimer.getRecordStr(recordCounter,recordObj,`taskName`),`\n`)
			recordCounter++		
		})
		return markdown
	}

	
	libTimer.getJobTimeRecordStr=function(timeRecordObj){
		let timeRecordStr=`{`
		if (timeRecordObj.length>0){
			for (let r of timeRecordObj){
				timeRecordStr+=`[`
				for (let key in r){
					timeRecordStr+=` ${key}=${r[key]} `
				}
				timeRecordStr+=`]`
			}
		}
		timeRecordStr+=`}`
		return timeRecordStr
	}
	
	
	libTimer.getRecordStr=function(recordCounter,recordObj,KeyFieldName){
		let recordStr=`### `+libTimer.getOutputNoteItemBulletSymbol()+` [${recordCounter}] `+recordObj[KeyFieldName]+`\n`
		recordStr+=`Field:`
		for (let key in recordObj){
			if (key!==KeyFieldName && recordObj[key]!==null){
				switch(true){
					case (key===`planRecords` || key===`implementRecords`):
						recordStr+=` @object-${key}`
						recordStr+=libTimer.getJobTimeRecordStr(recordObj[key])
						break
					case key===`tags`:
						recordStr+=` @object-${key}{`
						for (let j of recordObj[key]){
							recordStr+=` ${j.name},`
						}
						recordStr=recordStr.replace(/,$/g,` }`)
						break
					case key===`parent`:
						let parentTaskStr=libTimer.getParentTaskStr(recordObj)
						recordStr+=` @object-${key}{ ${parentTaskStr} } `
						break
					default:
						recordStr+=` @${key}(${recordObj[key]})`
						break
				}
			}
		}
		return recordStr
	}
	
	
	
	libTimer.displayTableData=function(tableName,tableObj,keyFieldName){
	//显示table data信息	
		try{
			console.log(`[in displayTableData]tableName=${tableName},tableObj=${tableObj},keyFieldName=${keyFieldName}`)
			let inputForm = new Form()
			inputForm.addField(new Form.Field.Option(
				keyFieldName,
				keyFieldName,
				tableObj,
				tableObj.map(t => t[keyFieldName]),
				tableObj[0]))

			for (let key in tableObj[0]){
				if (tableObj[0][key]){
					inputForm.addField(new Form.Field.String(key,key,tableObj[0][key]))
				}
			}
			
			let formPrompt = `请查看${tableName}信息，点击Continue按钮退出:`
			let formPromise = inputForm.show(formPrompt,"Continue")
		
			inputForm.validate = function(formObject){
				let t=formObject.values[keyFieldName]
				let validation=(t===tableObj[0])
				let fieldsNumber=inputForm.fields.length

 				if (!validation){
					for (let i=fieldsNumber-1;i>0;i=i-1){
						inputForm.removeField(inputForm.fields[i])
					}
					for (let key in t){
						if (t[key]){
							inputForm.addField(new Form.Field.String(key,key,t[key]))
						}
					}
					throw new Error("温馨提示：可下拉选择查看其它记录，回到第一个记录可以退出。按cancel也可以退出")
				}
				return validation
			}
		
			formPromise.then(function(formObject){
				try {
					console.log(`已退出${tableName}信息查看`)
				}
				catch(err){
					console.error(err)
				}
			})
		
			formPromise.catch(function(err){
				console.log("form cancelled", err.message)
			})
			
			formPromise.finally(()=>{
				console.log(`[in libTimer.displayTableData]formPromise.finally process: can do something。`)
			})
		}catch(err){
			new Alert(err.name, err.message).show()	
		}
	}
	
	
	
	


	return libTimer;
})()