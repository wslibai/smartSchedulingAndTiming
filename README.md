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


1.下载最新版本插件[latest release](https://github.com/wslibai/smartSchedulingAndTiming).
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

4.Run the `task scheduling` action and intelligently filter out the to-do task list from the database as `the task to be scheduled`.You can choose to run the action in three modes according to the actual needs: `top-level folder`, `specified TAG` and `full range`.

5.Run the `time arrangement` action, arrange the specific execution time intelligently according to the system setting parameters for `the tasks to be scheduled`,and Generate the 'tomato clock job' to be performed. You can choose to run the action according to the actual needs: by specified time quantums, by exclude time period, and the all time quantums.

6.Run the `start tomato clock` action, execute each job in the `tomato clock job list` to be executed in order, and automatically time the tomato clock time according to the preset duration, start time and end time parameters of the specific job. At the end of each tomato timer, the automatic pop-up window reminds the user (on macOS, you can also play sound reminders).And the timing data is stored in the title/notes/JSON file attachment of the task, and the specific storage method can be configured in the action `set preferences`.

7.After all `tomato clock job` are executed, you can run the `output task scheduling data` action and `output tomato clock data` action to output the relevant job data to the relevant diary software or clipboard. According to actual needs, you can choose to output data according to four modes: `by job type`, `by specified projects`, `by specified tasks`, `all`.


# 使用说明

此插件的一般使用流程是：
1.运行`initialize tags`动作，配置插件工作所需Tags。

2.运行`set preferences`动作，配置个性化参数。

3.在Flagged透视, Forecast透视, Inbox透视, Nearby透视, Projects透视, Review透视,Tags透视、“Kanban”Tag透视以及其他个性化透视界面，调整任务的Flaged、四象限Tag、预测透视的今日tag、Due、Defer等参数来改变待办任务的属性。

4.运行`task scheduling`动作,从数据库中智能筛选出待办任务列表，作为`待调度任务`。可根据实际需要选择按`顶层文件夹`、`指定TAG`、`全范围`三种模式运行该动作。

5.运行`time arrangement`动作，根据系统设置参数为`待调度任务`智能的安排具体执行时间，并生成待执行的`番茄时钟作业`。可根据实际需要选择`按指定时间段`、`按排除时间范围`、`按全部时间段`三种模式运行该动作。

6.运行`start tomato clock`动作，顺序执行待执行的`番茄时钟作业`列表中每一项作业，并根据具体作业所预设的时长、开始时间和结束时间参数自动进行番茄钟计时，每一个番茄计时结束，自动弹窗提醒用户（在macOS上，还可以同步播放声音提醒），并将计时数据存储在任务的标题/备注/JSON文件附件中，具体存储方式可以在动作`set preferences`中配置。

7.所有`番茄时钟作业`执行完成后，可以运行`output task scheduling data`动作和`output tomato clock data`动作输出作业相关数据到相关日记软件或者剪贴板。可根据实际需要选择按`按任务类型`、`按指定projects`、`按指定tasks`、`全部`四种模式输出数据。



# Functions

This plug-in bundle also has some functions included in "libTimer", which may help meet your own needs or create other plug-ins.

The specific usage introduction will be supplemented and improved in the future. Please look forward to it.


# 函数

这个插件包还有一些包含在“libTimer”中的函数，这些函数可能有助于满足您自己的需求或创建其他插件。

具体用法介绍将在后续进行补充完善，敬请期待。