#Atlasboard Atlassian package#

![Atlasboard Atlassian Package](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/jag-screenshot.png)

This is a package ready to be used with [Atlasboard](https://bitbucket.org/atlassian/atlasboard). It contains dashboards, widgets and jobs related to Atlassian products.

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

Uses image courtesy of [Ignacio Javier Igjav](http://commons.wikimedia.org/wiki/File:Bombilla_verde_-_green_Edison_lamp.svg)

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

![Blockers](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/blockers.png)

Displays blocker JIRA issues

Sample configuration:

    "confluence-blockers" : {
      "timeout": 30000,
      "authName": "myAuthJIRAkeyInTheGlobalAuthFile",
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

![Build overview](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/buildoverview.png)

Displays Bamboo build overview

Sample configuration:

    "buildoverview-UI" : {
      "bamboo_server" : "https://collaboration-bamboo.internal.atlassian.com",
      "retryOnErrorTimes" : 3,
      "interval" : 120000,
      "failBuilds":["CONFUI-QUNITFFESR", "CONFUI-QUNITFFLATEST", "CONFUI-QUNITCHROMEPLUGINS" ,
                    "CONFUI-QUNITCHROMELATEST", "CONFUI-QUNITQCCHROMELATEST", "CONFUI-QUNITQCFFLATEST",
                    "CONFUI-QUNITQEFFLATEST11", "CONFUI-QUNITIE9"],
      "showBuilds":[],
      "widgetTitle" : "QUNIT BUILDS",
      "showResponsibles" : false
    }

### Build Time Graph

![Build overview](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/build-time-graph.png)

Displays a graph of Bamboo build durations over a period of time

Sample configuration:

     "build-time-graph-UI" : {
       "bamboo_server" : "https://collaboration-bamboo.internal.atlassian.com",
       "authName" : "bamboo",
       "retryOnErrorTimes" : 3,
       "interval" : 120000,
       "widgetTitle" : "MASTER CI BUILD TIME",
       "planKey" : "SDHMASTER-SDHMASTERPRMY",
       "graphWidth" : 1200,
       "graphHeight" : 960,
       "dateRange" : "LAST_30_DAYS" // One of LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, ALL
     }

### Issue Count and Issues remaining

![Issues remaining](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/issuecount.png)

Displays JIRA issue count matching a certain filter

Sample configuration:

      "issues-warranty" : {
        "jira_server": "https://jira.atlassian.com",
        "authName": "jac",
        "retryOnErrorTimes" : 3,
        "interval" : 120000,
        "jqlOpen" : "project = CONF AND filter = \"All Editor CONF issues\" AND type = bug AND labels = warranty AND Resolution is EMPTY",
        "jqlReview" : "project = CONF AND filter = \"All Editor CONF issues\" AND type = bug AND labels = warranty AND Resolution = Fixed and updated > -14d",
        "widgetTitle" : "Warranty",
        "openText" : "Unresolved Warranty",
        "reviewText" : "Resolved Warranty"
      },

### Days Until

![Days Until](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/daysuntil.png)

Displays days until a certain date

Sample configuration:

    "daysuntil5.4": {
      "retryOnErrorTimes" : 3,
      "interval" : 120000,
      "dueDate": "11/15/2013",
      "milestone": "5.4 Freeze"
    }


### Pending Pull Requests

![Pending Pull Requests](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/pending-PR.png)

Display pending PRs in a repo, or all repos in a project for a list of users (a team)

Sample configuration:

      "pullrequests" : {
            "title": "PR workload",
            "widget": {
              "showZeroCounts": false,
              "useProportionalAvatars": true
            },
            "servers": {
              // server key matches credentials key in globalAuth (optional)
              "stash": {
                "provider": "STASH",
                "repositories": [
                    { "project": "CONF", "repository": "confluence" },
                    { "project": "JIRA", "repository": "jira" }
                ],
                "options": {
                  "baseUrl": "https://stash.atlassian.com"
                }
              },
              "stashdev": {
                "provider": "STASH",
                "repositories": [
                    { "project": "STASH" }
                ],
                "options": {
                  "baseUrl": "https://stash-dev.atlassian.com"
                }
              },
              "bitbucket.org": {
                  "provider": "BITBUCKET",
                  "repositories": [
                      { "org": "atlassian", "repository": "atlasboard-atlassian-package" }
                  ]
              }
            },

            "team": [
              // if email, related gravatar will be used. Otherwise, "display" property as a text
              { "username": "iloire",   "display": "ivan", "email": "iloire@atlassian.com" },
              { "username": "dwillis",  "display": "don", "email": "dwillis@atlassian.com" },
              { "username": "mreis",    "display": "miter", "email": "mreis@atlassian.com"},
              { "username": "lmiranda", "display": "luis", "email": "lmiranda@atlassian.com", "aliases": { "bitbucket.org": "luuuis" } }
            ]
         }

Don't forget to set the proper auth keys in your globalAuth.json:

```
  "stash": {
    "username": "stash-user",
    "password": "password123"
  },
  "stashdev": {
    "username": "stashdev-user",
    "password": "password123"
  },
  "bitbucket.org": {
    "username": "bitbucket-user",
    "password": "password123"
  }
```


Requires:
- md5.js


Supported providers:

 - STASH

Planned:

 - Ability to filter users by repositories.

### Sprint Health

![Sprint Health widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/sprint-health-widget.png)

Shows health and progress of all active sprints from your JIRA Agile Scrum board.

![Compact Sprint Health widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/sprint-health-widget-compact.png)

Also available with a compact display option for teams with lots of parallel sprints.

Sample configuration:

    "sprint-health": {
        "credentials": "jiraAuth", // username/password config key from your globalAuth file
        "jiraServer": "https://your.jiraserver.com",
        "rapidViewId": 561, // ID of your board in JIRA Agile (have a look in your board URL)
        "widgetTitle": "Sprint Health",
        "compactDisplay": true, // optional, defaults to false. For teams with many parallel sprints
        "includeSprintPattern": 'Blue Team', // optional, RegExp string for matching sprint names to include
        "interval": 300000
    }

The JIRA Agile board estimation statistic is used to draw the progress bars. If your team doesn't estimate stories you can still get the progress bars by switching the board's estimation statistic to 'Issue Count' (Board > Configure > Estimation > Estimation Statistic) or the pretty bars won't show up.

### Fitness

![Fitness](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/fitness.png)

Get in shape with your personal trainer!

    "fitness": {
      "media": ["dQw4w9WgXcQ", "z8f2mW1GFSI", "DP3MFBzMH2o", "CH1XGdu-hzQ", "sRYNYb30nxU", "3YOYlgvI1uE", "otCpCn0l4Wo", "vCadcBR95oU", "9EcjWd-O4jI", "5WLdLZnZQbQ", "CDl9ZMfj6aE", "BfOdWSiyWoc", "btPJPFnesV4", "lYlkYkHkZxs", "8NjbGr2nk2c"],
      "widgetTitle": "Daily Fitness",
      "activities": [{
        "name": "pushups",
        "cron": "00 30 10 * * 1-5",
        "title": "Pushup Time!",
        "announcement": "Time for morning push ups! With music presented by {0}",
        "hipchat": {
          "roomId": "00000",
          "from": "Sergeant",
          "message": "Time for some pushups!"
        }
      }, {
        "name": "planks",
        "cron": "00 00 15 * * 1-5",
        "title": "Planks",
        "announcement": "Get down for some serious planking! {0}",
        "hipchat": {
          "roomId": "00000",
          "from": "Sergeant",
          "message": "Time for some planks!"
        }
      }, {
        "name": "debug",
        "cron": "30 * * * * *",
        "title": "lets debug",
        "announcement": "yoyo debug {0}",
        "hipchat": {
          "roomId": "00000",
          "from": "Sergeant",
          "message": "Time for some pushups!"
        },
        "enabled": false
      }]
    }

### Empty placeholder

Just that:)

![Compact Sprint Health widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/empty-placeholder.png)

      "empty-placeholder": {
        "title": "EMPTY",
        "description": "Placeholder"
      },

### Google analytics real-time widgets

#### Table with results

![Google analytics table results widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/ga-results-table.png)

#### Single metric

![Google analytics single metric widget](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/ga-metric.png)

Use the following configuration example to feed both:

      "form-completion-now": {
        "interval": 60000,
        "title": "Signups",
        "subtitle": "Last 30'",
        "viewID": "1009XXXXX",
        "authEmail": "335287341572-bbcqXXXXXXXXXXXXXXXX@developer.gserviceaccount.com",
        "metrics": ["rt:goal16Completions"],
        "dimensions": ["rt:minutesAgo", "rt:browser", "rt:browserVersion"],
        "captions": ["min. ago", "browser", "version", "Conversions"],
        "realTime": true,
        "gaKeyLocation": 'mykey.p12' // file must be located inside the wallboard directory
      },

### Elasticsearch time series job and widget

![Elasticsearch time series](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/elasticsearch.png)

Create time series charts form Elasticsearch

Features:

  - Multi series
  - Custom ES index per serie
  - Custom chart renderer per serie

Example configuration:

    "reactivations-trend": {
      "interval": 600000,
      "widgetTitle": "Reactivations / pass. for inactivity / pass. never logged in",
      "authName": "laas",
      "port": 9200,
      "host": "queries.prod.laas.atlassian.io",
      "queryOptions": {
        "time_zone": "+10:00"
      },
      "series": [
        {
          "name": "Reactivations",
          "color": "green",
          "renderer": "line",
          "index": "logs_ntt_hal-prod_prod*",
          "query": {
            "filtered": {
              "query": {
                "match_phrase": {
                  "path": "atlassian.net/activate"
                }
              },
              "filter": {
                "range": {
                  "@timestamp": {
                    "gt": "now-30d"
                  }
                }
              }
            }
          }
        }
      ],
      "groupBy": "1d",
      "chartConfig": {
        "xFormatter": "%e/%m"
      }
    },

### Elasticsearch

A simple job to query Elasticsearch with a custom query.
You can plug your own widget to handle the result. For time series charts, see the "Elasticsearch time series" widget and job.

### Iframe

![Iframe](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/iframe.png)

Drop an iframe into your widget

    "iframe-Atlasboard": {
      "title": "Atlasboard in an iframe",
      "url": "http://atlasboard.bitbucket.org/"
    }

### BitBucket Builds

![Bitbucket Builds](https://bitbucket.org/atlassian/atlasboard-atlassian-package/raw/master/screenshots/bitbucket-builds.png)

See the build status of each of your BitBucket branches. Works great with [BitBucket Pipelines](https://bitbucket.org/product/features/pipelines).

```json
"bitbucket-builds": {
  "credentials": "bitbucket",
  "interval": 60000,
  "title": "My Repo Builds",
  "repo": "username/repo",
  "branchCount": 12,
  "showCulprits": true,
  "importantBranches": [
    "master"
  ]
},
```

The `showCulprits` option shows the avatar of the person whose commit made a branch go from green to red.

Any branch names listed in `importantBranches` will be shown at the top of your board in large type.
