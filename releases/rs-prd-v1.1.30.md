---
version: rs-prd-v1.1.30
date: May 12, 2022
---

## What's Changed
* Make new report scheduling
* Feature/rs 1142 backmerge stg dev
* Backmerge of Task Title Date Fix
* Add TypeORM replication setup
* Can't connect to db error
* Feature/rs 1166 typeorm cleanup
* fix/RS-923 Vehicle Missing Data Report - Missing Vehicle Entries for Drivers with Incomplete vehicleLastUsed DDD Log
* Fix issue with activity delete
* Migrate "task_manager" queue to SQS
* Move Redis queues to SQS
* Legacy imports queue is FIFO
* Path to ConfigOption
* Fix error propagation
* Fix SQS queue getting stuck
* STAGING RELEASE: Fix for stucked importers
* Backmerge: STG -> DEVELOP
* Back/rs 1195 2
* Remove report pre-generating from the import flow
* RS-1172 prebuilding missing data optimisation
* RELEASE: Importer fix
* STAGING RELEASE: BullJs Removal & Missing data optimisation
* Hotfix: Increase worker timeout from 15min to 30min
* Remove <queue>_IS_FIFO env variables
* Backmerge hotfix
* Fix: Upload files to S3 before import
* Add missing task descriptions
* Optimize Update Vehicle Query
* Add Support for force task generating
* Add missing tasks to vehicle task list
* BackMerge: STG -> DEV
* Remove cron job for timeout detection
* Rs stg
* start and end of missind data activities are incorrect
* no new missing tasks for driver after one is created
* Missing data range wrong for driver in report
* Import - External API Imports Empty Strings Allowed on fileName & fileBytes
* Rs stg
* Missing data flow optimisations
* Add missing event subtypes
* Add missing event subtypes
* Exclude unsupported task from getting min max
* Fix Dashboard - Driver Card Expiration Widget Throws 500 on …
* RELEASE: BullJs Removal & Missing data optimisation