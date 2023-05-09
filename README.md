# About

This is an Omni Automation plug-in bundle for OmniFocus that can according to  the GTD principle,the four quadrant working mothod,three frong's working method,kanban working mothod and tomato working method,smart scheduling tasks and timing tracking.

It also provides an interface for setting preferences parameters, so that you can adjust various system operation parameters at any time, such as the priority of various tasks involved in the scheduling algorithm, the timing parameters of the tomato work method, the daily work and life time setting, the data output setting, etc.

It also provides tools for output the task timing data recording and the tomato time-tracking data records to diary software ,for example Drafts,Day One journal,Obsidian,etc, or to the clipboard.

It also provides a variety of useful functions that can be used by other plugins or scripts.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from a random amateur on the internet!_


# 关于

这是一款Omnifocus自动化插件包，它能根据GTD原理、四象限工作法、三只青蛙工作法、看板工作法和番茄工作法智能的调度任务（task）、并进行计时跟踪。

它还提供设置preferences参数的界面，便于你随时调整各种系统运行参数，如调度算法涉及的各类任务的优先数、番茄工作法的定时参数、每日的工作和生活时间段设置、数据输出设置等。

它还提供工具将任务（task/job）计时数据记录、番茄时间跟踪数据记录输出至日记类软件，如Drafts,Day One journal,Obsidian等,或者输出至剪贴板。

它还提供可供其它插件或脚本使用的各种有用的函数。

_请注意我的GitHub账号上的（或者其他方式分享的）所有脚本都在进行中，如果你发现任何问题或者有任何建议，请及时让我知道。并且请你在运行互联网上随机作者的脚本前备份好你的数据库。_


## Known issues 

### tomato timing can't run in the background on iOS

The "start tomato clock" action can't run in the background on iOS,Once Omnifocus exits the foreground interface, the timing script of the action will exit abnormally.

### Other

Refer to ['issues'](https://github.com/wslibai/smartSchedulingAndTiming/issues) for other known issues and planned changes/enhancements.


## 已知问题

### 番茄计时无法在iOS设备的后台运行

start tomato clock动作无法在iOS设备的后台运行，一旦Omnifocus退出前台界面，该动作的计时脚本将异常退出。

### 其他

有关其他已知问题和计划中的更改/增强，请参阅['issues'](https://github.com/wslibai/smartSchedulingAndTiming/issues)。



# Installation & Set-Up

**Important note: for this plug-in bundle to work correctly, [Synced Preferences for OmniFocus plug-in](https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately.**

**Important note: In order to work together with the Kanban function, this office website plug-in [Plug-In: Kanban Board for OmniFocus](https://omni-automation.com/omnifocus/plug-in-kanban-board.html) can be installed. If not installed, this plug-in can also create relevant TAGs and use the TAG view to view related tasks**


1. Download the [latest release](https://github.com/wslibai/smartSchedulingAndTiming).
2. Unzip the downloaded file.
3. Move the `.omnifocusjz` file to your OmniFocus plug-in library folder (or open it to install).
4. Configure your preferences using the `set preferences` action. 

# 安装和设置

**重要提示：为了使此插件包正常工作，还需要[Synced Preferences for OmniFocus plug-in](https://github.com/ksalzke/synced-preferences-for-omnifocus)插件，并且需要单独添加到插件文件夹中。**

**重要提示：为了使用看板功能协同工作，这个官网插件 [Plug-In: Kanban Board for OmniFocus](https://omni-automation.com/omnifocus/plug-in-kanban-board.html)可选择安装。如不安装，本插件也可建立相关TAG，并可使用TAG视图查看相关任务。**


1.下载最新版本插件[latest release](https://github.com/wslibai/smartSchedulingAndTiming)。

2.解压下载的文件。

3.将`.omnifocusjz` 文件复制/移动到OmniFocus插件库文件夹（或者双击打开文件来安装）。

4.使用`set preferences`动作配置你的preferences。


# Actions

This plug-in includes three main actions: task scheduling, time arrangement, start tomato clock, and auxiliary actions such as stop tomato clock, updating timeSpent data, clean time data, clean scheduling task, outputting data, set preferences, and initialize tags.


# 动作

此插件包含任务调度、时间安排、启动番茄时钟三个主要动作和停止番茄时钟、更新时间消耗数据、清理时间数据、清理调度任务、输出数据、设置首选项和初始化tags等辅助动作。


# Instructions for use

The general use process of this plug-in is:

1.Run the `initialise tags` action to configure the tags required for plug-in work.

2.Run the `set preferences` action and configure personalised parameters.

3.In the flagged perspective, forecast perspective, inbox perspective, nearby perspective, projects perspective, review perspective, tags perspective, "kanban" tag perspective and other personalised perspective interfaces, adjust the parameters of the task's flaged, four quadrant tag, forecast perspective today's tag, due, defer and other parameters to change the attributes of the tasks.

4.Run the `task scheduling` action and intelligently filter out the to-do task list from the database as `the task to be scheduled`.You can choose to run the action in three modes according to the actual needs: `top level folder`, `specified TAG` and `full range`. The preference parameter `folderIdsToExclude` specifies the `folder IDs to be excluded`, and the preference parameter `tagIdsToExclude` specifies `TAG IDs to be excluded`. The `top level folder` mode preference parameter `folderIdsToExclude` does not work; `Specify TAG` mode preference parameter `tagIdsToExclude`` does not work.

5.Run the `time arrangement` action, arrange the specific execution time intelligently according to the system setting parameters for `the tasks to be scheduled`,and Generate the 'tomato clock job' to be performed. You can choose to run the action according to the actual needs: by specified time quantums, by exclude time period, and the all time quantums.

6.Run the `start tomato clock` action, execute each job in the `tomato clock job list` to be executed in order, and automatically time the tomato clock time according to the preset duration, start time and end time parameters of the specific job. At the end of each tomato timer, the automatic pop-up window reminds the user (on macOS, you can also play sound reminders).And the timing data is stored in the title/notes/JSON file attachment of the task, and the specific storage method can be configured in the action `set preferences`.

7.After all `tomato clock job` are executed, you can run the `output task scheduling data` action and `output tomato clock data` action to output the relevant job data to the relevant diary software or clipboard. According to actual needs, you can choose to output data according to four modes: `by job type`, `by specified projects`, `by specified tasks`, `all`.

8.After running the `task scheduling` action, if the attribute parameters of the task are adjusted, before continuing to implement the subsequent action, you can run the `clean scheduling task` action to clear the `task to be scheduled` data, and then re-run the `task scheduling` action to generate the latest `task to be scheduled`.（Note: iOS devices can repeat the `task scheduling` action at any time without running this `clean scheduling` action.）

9.During the operation of the plug-in, the corresponding Tag will be used to indicate the relevant working status.

9.1 `Scheduling|调度`TAG is used to indicate the specific scheduling and execution status of the task: `Scheduled` means that it has entered the scheduling list; `Arranged` means that the time has been scheduled; `Running` means that `tomato cLock` is in progress timing; `Finished` indicates that it has been executed. After each run of the `task scheduling` action, the `Scheduling|TAG` will clear the reset to reflect the task status in the new `tasks to be scheduled` list.

9.2 `Timer|Timening`TAG is also used to indicate the status of the task related to timing: `Timing` means that the tomato clock time is being done; `Timed` means that the tomato clock timer has been timed and the timer has ended; `Abort` means that the task has been artificially run `stop tomato clock` during the timing process; `Overtime` means that the actual time spent on the task has exceeded the value set in the estimated time field (`estimatedMinutes`).


9.3 `Kanban`TAG is also used to indicate the current state of the task: `In Progress` indicates that the task is being processed. This tag will be added to the task that has been timed after running the `start tomato clock` action. `Done` means that the actual time spent on the task has exceeded the value set in the estimated time field (`estimatedMinutes`), which is consistent with the meaning of `Overtime` in `Timer|timing`TAG group. You can further verify whether the relevant task has really been completed, set the task to complete, or reset `estimatedMinutes` and manually clear the relevant tags.


9.4 `TimeQuantum|Time period`	 TAG is also used to indicate the specific time period of the pending task. The data will be cleared every time the "task scheduling" action is run, and the data will be cleared and reset every time the "time arrangement" action is redistributed.


**Important reminder: In order to facilitate the timing operation of the tomato clock, the plug-in provides acceleration test mode setting parameters, `accelerated test mode` and `accelerated test mode tomato d Uration in sec(5-60)`, you can configure and test as needed. After the test, please remember to set the `accelerated test mode` parameter to `false` to turn off the accelerated test mode.**


 

# 使用说明

此插件的一般使用流程是：

1.运行`initialize tags`动作，配置插件工作所需Tags。

2.运行`set preferences`动作，配置个性化参数。

3.在Flagged透视, Forecast透视, Inbox透视, Nearby透视, Projects透视, Review透视,Tags透视、“Kanban”Tag透视以及其他个性化透视界面，调整任务的Flaged、四象限Tag、预测透视的今日tag、Due、Defer等参数来改变待办任务的属性。

4.运行`task scheduling`动作,从数据库中智能筛选出待办任务列表，作为`待调度任务`。可根据实际需要选择按`顶层文件夹`、`指定TAG`、`全范围`三种模式运行该动作。偏好参数`foldersToExclude`指定要`排除的文件夹`, 偏好参数`tagsToExclude`指定要 `排除的TAGs`。在`顶层文件夹`模式偏好参数`foldersToExclude`不起作用；在`指定TAG`模式偏好参数`tagsToExclude`不起作用。

5.运行`time arrangement`动作，根据系统设置参数为`待调度任务`智能的安排具体执行时间，并生成待执行的`番茄时钟作业`。可根据实际需要选择`按指定时间段`、`按排除时间范围`、`按全部时间段`三种模式运行该动作。

6.运行`start tomato clock`动作，顺序执行待执行的`番茄时钟作业`列表中每一项作业，并根据具体作业所预设的时长、开始时间和结束时间参数自动进行番茄钟计时，每一个番茄计时结束，自动弹窗提醒用户（在macOS上，还可以同步播放声音提醒），并将计时数据存储在任务的标题/备注/JSON文件附件中，具体存储方式可以在动作`set preferences`中配置。

7.所有`番茄时钟作业`执行完成后，可以运行`output task scheduling data`动作和`output tomato clock data`动作输出作业相关数据到相关日记软件或者剪贴板。可根据实际需要选择按`按任务类型`、`按指定projects`、`按指定tasks`、`全部`四种模式输出数据。

8.在运行`task scheduling`动作后，如果对任务的属性参数进行了调整，在继续实施后续动作之前，可运行`clean scheduling task`动作来清除`待调度任务`数据，再重新运行`task scheduling`动作，以生成最新的`待调度任务`。（说明：iOS设备可以不运行此`clean scheduling task`动作，随时重复运行`task scheduling`动作。）

9.插件运行过程中，会使用相应的Tag来指示相关工作状态。

9.1 `Scheduling|调度`TAG用于指示任务的具体调度和执行状态：`Scheduled`表示已进入调度列表； `Arranged`表示已安排时间； `Running`表示正在进行`tomato clock`计时； `Finished`表示已经执行完毕。 `Scheduling|调度`TAG在每次运行`task scheduling`动作后，会清除重新设定，以反映新的`待调度任务`列表中的任务状态。

9.2 `Timer|计时`TAG也用于指示任务与计时相关的状态：`Timing`表示正在进行番茄钟计时； `Timed`表示曾经进行过番茄钟计时，并且已经计时结束； `Abort`表示任务在计时过程中曾经被人为运行`stop tomato clock`动作中止计时； `Overtime`表示任务实际花费的时间已经超过估计时间字段（`estimatedMinutes`）设置的值。

9.3 `Kanban`TAG也用于指示任务的当前状态：`In Progress`表示任务正在处理，在运行`start tomato clock`动作启动过`tomato clock`计时的任务，会添加此tag。`Done`表示任务实际花费的时间已经超过估计时间字段（`estimatedMinutes`）设置的值，与`Timer|计时`TAG group中的`Overtime`含义一致，您可进一步核实相关任务是否已经真的执行完毕，并将任务设为完成，或者重设`estimatedMinutes`，并手动清除相关tag。	

9.4 `TimeQuantum|时间段`	TAG也用于指示待处理任务的具体安排时间所处的时间段。每次运行`task scheduling`动作该数据会被清除，每次运行`time arrangement`动作重新分配时间时该数据会被清除并重设。
		
			
**重要提醒：为了方便测试番茄钟计时操作，插件提供了加速测试模式设置参数，`accelerated test mode(加速测试模式)`和`accelerated test mode tomato duration in sec(5-60)`，您可根据需要进行配置和测试，测试完毕后请记得将`accelerated test mode(加速测试模式)`参数设置为`false`以关闭加速测试模式。**



# preferences


## foldersToExclude

Display Name: `folders To Exclude/taskScheduling Excluded Folders`. It is used to set the 'folder' to be excluded when running the `task scheduling` action. The preference parameter "foldersToExclude" does not work in the "top level folder" mode.

## tagsToExclude
			
Display Name: `tags To Exclude/taskScheduling Excluded Tag`. It is used to set the `TAG` to be excluded when running the `task scheduling` action. The `Specify TAG` mode preference parameter `tagsToExclude` does not work.

## maxNumberOfScheduledTasks

Display Name: `max Number Of scheduled tasks(5-60)`. It is used to set the maximum number of scheduling tasks when running the `task scheduling` action. The setting range is 5 to 60. If the range is exceeded, an error will be reported and cannot be saved. **The same below.**

## todayIncludeTag

Display Name: `today Include Tag`. The task containing this tag will be displayed in today's forecast perspective, and it is recommended to be consistent with the parameter settings of Omnifocus today's forecast perspective. When running the `task scheduling` action, the program will include the task whose expiration time (Due) is empty but contains this TAG in the `task to be scheduled`.
			
## priorityNumberDueIn1Day

Display name: `priority Number DueIn1Days(600-999)`. It means `DueIn1Days` (expires within one day) task priority number (`priority Number`), which is the parameter of the internal sorting task of the program when running the `task scheduling` action, and the number is the priority. **Other parameter meanings containing the prefix of `priorityNumber` are similar to this.**  

## startSchedulingForTomorrow

Display name: `startSchedulingForTomourrow (when to start scheduling tomorrow's time)`. It means to arrange the starting time of tomorrow's to-do task schedule. After this time point, running the `time arrangement` action will pre-arrange the schedule for tomorrow's to-do tasks.

## todayPlanTimeLead

Display name: `todayPlanTimeLead (plan today's task time in advance 5-60)'. It means to arrange today's to-do schedule in advance (in minutes), and the setting range is 5 to 60. That is, how many minutes are the starting time of today's first to-do task?

## timeArrangementStrictMode

Display name: `time Arrangement Strict Mode (Work tasks do not take up rest time)`. It means whether to adopt a strict strategy to allocate task time, that is, whether work tasks can be arranged during non-working hours. Non-work tasks are not controlled by this parameter, and priority will be given to the corresponding non-working hours. When all non-working hours are full, they can be arranged in the current free working hours.


## tomatoFocusDuration

Display name: `tomato Focus Duration in minutes(10-59)`. It is used to set the focussing time (in minutes) of the tomato clock used by the program when running the `time arrangement` action. The setting range is 10-59.

## tomatoShortRestTime

Display name: `tomato Short Rest Time in minutes(0-9)`. It is used to set the short rest time (in minutes) of the tomato clock used by the program when running the `time arrangement` action. The setting range is 0-9.


## tomatoLongRestTime

Display name: `tomato Long Rest Time in minutes(0-19)`. It is used to set the tomato clock used by the program when running the `time arrangement` action (in minutes). The setting range is 0-19.			
			
## tomatoNumberPerLoop

Display name: `tomato Number Per Loop(1-6)`. It is used to set the parameters used by the program when running the 'time arrangement' action: several tomato clocks are a cycle, that is, a long break is arranged every few tomato clocks. The setting range is 1-6.


## defaultEstimatedMinutes

Display name: `default EstimatedMinutes for task(1-30)`. It is used to set the default estimated time of the task. When running the `start tomato clock` action, if the task does not set the estimated time attribute value, the program will automatically set it to this parameter value.



## tomatoSoundFile

Display name: `tomato clock warn sounds`. It means the system prompt tone when the tomato clock times out. This parameter is only used for macOS.
				

## acceleratedTestMode

Display name: `accelerated test mode'. It means whether to turn on the accelerated test mode to speed up the operation of the tomato clock.
			

## acceleratedTestModeTomatoDurationInSec

Display name: `accelerated test mode tomato duration in sec(5-60)`. It means the duration of the tomato clock in the accelerated test mode, in seconds, and the setting range is 5 to 60.			
			

## completeProgressInTitle

Display name: `save completeProgress in project/task's title`. It means whether to save the completion progress information in the title of the project/task.


## completeProgressInNote

Display name: `save completeProgress in project/task's note`. It means whether to save the completion progress information in the note field of the project/task.

## completeProgressInJSON

Display name: `save completeProgress in project/task's JSON file`. It means whether to save the completion progress information in the attachment of the project/task in JSON.

## overtimeShouldWarn

Display name: `project/task overtime should warn`. It means whether to warn when the project/task timed out, specifically whether the actual time spent on the project/task exceeds the pre-set estimated time.


## outputNoteItemBulletSymbol

Display name: `output note item bullet symbol (1-3 digit non-letter, non-number, non-underscore)`. It means to add bullet symbols at the beginning of each item in the output notes.


## iOSObsidianVaultTitle

Display name: `iOS obsidian vault title (for data output)`. It means to output the library (vault) title of the target object Obsidian on the iOS device.

## macOSObsidianVaultTitle

Display name: `macOS obsidian vault title (for data output)`. It means to output the library (vault) title of the target object Obsidian on macOS devices.


## iOSObsidianFilePathBaseOnVault

Display name: `iOS obsidian file path base on vault (ending with/)`. It means to output the target object Obsidian file path (relative path based on the library) on the iOS device.

## macOSObsidianFilePathBaseOnVault

Display name: `macOS obsidian file path base on vault (ending with/)`. It means to output the target object Obsidian file path (libran-based relative path) on macOS devices.


# 偏好设置

## foldersToExclude

显示名称：`folders To Exclude/taskScheduling排除的文件夹`。用于设置运行`task scheduling`动作时要排除在外的`文件夹`。在`顶层文件夹`模式偏好参数`foldersToExclude`不起作用。

## tagsToExclude
			
显示名称：`tags To Exclude/taskScheduling排除的Tag`。用于设置运行`task scheduling`动作时要排除在外的`TAG`。在`指定TAG`模式偏好参数`tagsToExclude`不起作用。

## maxNumberOfScheduledTasks

显示名称：`max number Of scheduled tasks(5-60)`。用于设置运行`task scheduling`动作时最大调度任务数量。设置范围为5至60个，超出范围会报错，无法保存。**下同。**

## todayIncludeTag

显示名称：`today Include Tag`。包含此Tag的任务将显示在今日预测透视中，建议与Omnifocus今日预测透视的参数设置一致。运行`task scheduling`动作时，程序会将到期时间（Due）为空但含有此TAG的任务列入`待调度任务`。
			
## priorityNumberDueIn1Day

显示名称：`priority Number DueIn1Days(600-999)`。含义为`DueIn1Days`(一天内到期)任务的优先数（`priority Number`），这是运行`task scheduling`动作时程序内部排序任务的参数，数字大优先。**其它含有`priorityNumber`前缀的参数含义与此类似。**


## startSchedulingForTomorrow

显示名称：`startSchedulingForTomorrow(何时开始安排明天的时间)`。含义为安排明天的待办任务时间表的起始时间点，在此时间点以后，运行`time arrangement`动作将为明天的待办任务预先安排时间表。


## todayPlanTimeLead

显示名称：`todayPlanTimeLead(计划今日任务时间的提前时间5-60)`。含义为安排今日的待办任务时间表的时间提前量（单位为分钟），设置范围为5至60。即今日的第一个待办任务的起始时间安排为多少分钟以后。



## timeArrangementStrictMode

显示名称：`time Arrangement Strict Mode(工作任务不占休息时间)`。含义为是否采用严格的策略来分配任务时间，即工作任务是否可以安排在非工作时间。非工作任务不受此参数控制，将优先安排在对应的非工作时间段，当非工作时间段全部排满时，可以安排在当前空闲的工作时间段。



## tomatoFocusDuration

显示名称：`tomato Focus Duration in minutes(10-59)`。用于设置运行`time arrangement`动作时程序使用的番茄钟专注时长（以分钟为单位）。设置范围为10-59。

## tomatoShortRestTime

显示名称：`tomato Short Rest Time in minutes(0-9)`。用于设置运行`time arrangement`动作时程序使用的番茄钟短休息时长（以分钟为单位）。设置范围为0-9。


## tomatoLongRestTime

显示名称：`tomato Long Rest Time in minutes(0-19)`。用于设置运行`time arrangement`动作时程序使用的番茄钟长休息时长（以分钟为单位）。设置范围为0-19。			
			
## tomatoNumberPerLoop

显示名称：`tomato Number Per Loop(1-6)`。用于设置运行`time arrangement`动作时程序使用的参数：几个番茄钟为一个循环，即每隔几个番茄钟安排一次长休息。设置范围为1-6。


## defaultEstimatedMinutes

显示名称：`default EstimatedMinutes for task(1-30)`。用于设置任务的缺省估计时间，在运行`start tomato clock`动作时，如果任务没有设定估计时间属性值，程序将自动将它设置为此参数值。



## tomatoSoundFile

显示名称：`tomato clock warn sounds`。含义为番茄时钟超时的时候系统提示音。该参数仅用于macOS。
				

## acceleratedTestMode
显示名称：`accelerated test mode(加速测试模式)`。含义为是否开启加速测试模式来加快番茄时钟的运行。
			

## acceleratedTestModeTomatoDurationInSec

显示名称：`accelerated test mode tomato duration in sec(5-60)`。含义为加速测试模式下番茄时钟的时长，以秒为单位，设置范围为5至60。
			
			

## completeProgressInTitle

显示名称：`save completeProgress in project/task's title`。含义为是否将完成进度信息保存在项目/任务的标题（title）内。


## completeProgressInNote
显示名称：`save completeProgress in project/task's note`。含义为是否将完成进度信息保存在项目/任务的备注（note）字段内。

## completeProgressInJSON

显示名称：`save completeProgress in project/task's JSON file`。含义为是否将完成进度信息以JSON方式保存在项目/任务的附件内。

## overtimeShouldWarn

显示名称：`project/task overtime should warn`。含义为当项目/任务超时的时候是否警告提示，具体是指项目/任务实际花费时间是否超出了预先设置的估计时间。


## outputNoteItemBulletSymbol

显示名称：`output note item bullet symbol(1-3位非字母、数字、下划线)`。含义为添加在输出笔记每个项目（item）行首的子弹符号。


## iOSObsidianVaultTitle

显示名称：`iOS obsidian vault title(数据输出用)`。含义为iOS设备上输出目标对象Obsidian的库（vault）标题。

## macOSObsidianVaultTitle

显示名称：`macOS obsidian vault title(数据输出用)`。含义为macOS设备上输出目标对象Obsidian的库（vault）标题。


## iOSObsidianFilePathBaseOnVault

显示名称：`iOS obsidian file path base on vault(以/结尾)`。含义为iOS设备上输出目标对象Obsidian的文件路径（基于库的相对路径）。

## macOSObsidianFilePathBaseOnVault

显示名称：`macOS obsidian file path base on vault(以/结尾)`。含义为macOS设备上输出目标对象Obsidian的文件路径（基于库的相对路径）。


# Functions

This plug-in bundle also has some useful functions included in "libTimer", which you can use in your own script or plug-in. 

For specific functions and usage, please read the source code file of the plug-in library "libTimer".


# 函数

这个插件包还有一些包含在“libTimer”中的有用的函数，您可以在自己的脚本或插件中使用它。

具体功能和用法请阅读插件库“libTimer”的源代码文件。