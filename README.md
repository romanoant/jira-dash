#Atlasboard Atlassian package#

![Atlasboard Atlassian Package](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/screenshot1.jpeg)

##Build status##

[![Build Status](https://drone.io/bitbucket.org/atlassian/atlasboard-atlassian-package/status.png)](https://drone.io/bitbucket.org/atlassian/atlasboard-atlassian-package/latest)

This is a package ready to be used with [Atlasboard](http://atlasboard.bitbucket.org). It contains dashboards, widgets and jobs related to Atlassian products.

##Installation##

From the root directory of your **recently created wallboard**, you just need to type:

    git submodule add https://bitbucket.org/atlassian/atlasboard-atlassian-package packages/atlassian

to import the package as **git submodule** and use any of the widgets and jobs in this package (check the example dashboard to see how).

See also: [https://bitbucket.org/atlassian/atlasboard/wiki/Package-Atlassian]()

## Available jobs/widgets

### Clock

![Clock widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/stfu.png)

Displays current time and optionally shut the f**k up hours.

Sample configuration:

	"clock": {
		"interval": 0,
		"stfuOnly": false,
		"stfuHours":[
			{"start":945, "end": 1215},
			{"start":1415, "end": 1615}
		]
	}

*stfuOnly* if true the bulb will be visible only, clock is not displayed

*stfuHours* you can list as many intervals as you wish, 945 means 9:45

### Reviews Counter

Displays any reviews associated with team members.

Sample configuration:

	"reviews": {
		"title": "Outstanding Reviews",
		"authName": "atlaseye",
		"crucibleUrl": "https://your.crucible.com",
		"teamMembers": [
			"pniewiadomski",
			"jsmith"
		],
		"projects": [
			"CR-JRA"
		]
	}

*title* the widget header

*authName* authorization configuration to use that's defined in globalAuth.json

*crucibleUrl* Crucible address

*teamMemebers* list of usernames from Crucible that you want to list reviews for

*projects* list of Crucible project keys to check for reviews

### Blockers

![Clock widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/blockers.png)

Displays blocker JIRA issues

Sample configuration:

    "confluence-blockers" : {
      "timeout": 30000,
      "retryOnErrorTimes" : 3,
      "interval" : 120000,
      "jira_server" : "https://jira.atlassian.com",
      "useComponentAsTeam" : true,
      "projectTeams": {
        "CONFDEV": "Teamless Issue",
        "CONFVN": "Vietnam"
      },
      "jql" : "(project in (\"CONFDEV\",\"CONFVN\") AND resolution = EMPTY AND priority = Blocker) OR (project = \"CONF\" AND resolution = EMPTY AND priority = Blocker AND labels in (\"ondemand\"))"
    }


### Build Overview

![Clock widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/buildoverview.png)

Displays Bamboo build overview

Sample configuration:

    "buildoverview-UI" : {
      "bamboo_server" : "https://confluence-bamboo.internal.atlassian.com",
      "retryOnErrorTimes" : 3,
      "interval" : 120000,
      "failBuilds":["CONFUI-QUNITFFESR", "CONFUI-QUNITFFLATEST", "CONFUI-QUNITCHROMEPLUGINS" , 
                    "CONFUI-QUNITCHROMELATEST", "CONFUI-QUNITQCCHROMELATEST", "CONFUI-QUNITQCFFLATEST", 
                    "CONFUI-QUNITQEFFLATEST11", "CONFUI-QUNITIE9"],
      "showBuilds":[],
      "widgetTitle" : "QUNIT BUILDS"
    }
