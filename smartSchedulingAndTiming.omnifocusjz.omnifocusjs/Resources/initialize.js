(function () {

	let action = new PlugIn.Action(async function(selection, sender){

		try {
			const lib=this.libTimer
			let tagGroup = "Timer|计时"
			let tagTitles = ["Timing","Timed","Abort","Overtime"]
			lib.setupTags(tagGroup,tagTitles)

			tagGroup = "FourQuadrant|四象限"
			tagTitles = ["ImportanceUrgency","Importance","Urgency","NotUrgency"]
			lib.setupTags(tagGroup,tagTitles)

			tagGroup = "TimeQuantum|时间段"
			tagTitles = ["WorkTime|工作时间","RestTime|休息时间"]
			lib.setupTags(tagGroup,tagTitles)
			tagGroup = "WorkTime|工作时间"
			tagTitles = ["Forenoon|上午","afternoon|下午"]
			lib.setupTags(tagGroup,tagTitles)		
			tagGroup = "RestTime|休息时间"
			tagTitles = ["Moring|早上","Lunch|午餐","Noon|中午","NoonBreak|午休","dinner|晚餐","night|晚上"]
			lib.setupTags(tagGroup,tagTitles)
						
			tagGroup= "EstimatedTime|估计时间"
			tagTitles = ["BigFrog|>1h","SmallFrog|30-60m","Quarter|15-30m","ShortTime|5-15m","FewMinutes|<5m"]
			lib.setupTags(tagGroup,tagTitles)
			
			tagGroup = "Energy|精力"
			tagTitles = ["Full|充足","Normal|正常","Tried|困乏"]
			lib.setupTags(tagGroup,tagTitles)

			tagGroup = "Scheduling|调度"
			tagTitles = ["Scheduled","Arranged","Running","Finished"]
			lib.setupTags(tagGroup,tagTitles)
			
			tagGroup = "Kanban"
			tagTitles = ["To Do", "In Progress", "Waiting", "Done"]
			lib.setupTags(tagGroup,tagTitles)
			
		}
		catch(err){
			new Alert(err.name, err.message).show()	
		}		
	});
	
	action.validate = function(selection, sender){
		return true
	};
	
	return action;
})()