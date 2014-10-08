# assets-manager v0.1.0

> Create minified javascript and css files through an automated Javascript Task Runner.


## Purpose of the tool
Provide an alternative way to setup and maintain a Javascript Task Runner as easy as setting properties on a config file.
Nor Grunt and Node knowledge is required in order to configure your settings.

## Getting Started

This tool requires:
* npm `~1.3.10`
* node `~0.10.0`
* Grunt `~0.4.0`

To install npm and node, check out the [Node.js website](http://nodejs.org/).

To install Grunt, once node and npm are installed run the following command:
```shell
npm install grunt-cli -g
```

To install the dependencies, run the following command from the project root folder:
```shell
assets-manager\$ npm install
```

## How it works

To run assets-manager, execute the following command:
```shell
assets-manager\$ grunt --config=<configuration_file> --force
```

Out of the configuration file, all bundles will be resolved into collection of files. Each file will eventually be minified and concatenated to generate an destination output in every specified location. 

### Configuration

From the configuration file, you can set up bundles for either scripts and stylesheets.
A bundle is a group of files, and files in a bundle can be minified and concatenated.
To better understand how a configuration file works, checkout `configs\demo.json`

```js
{
	"javascripts":[...]
	, "styles":[...]
}
```

#### references

Multiple bundles can be referenced together and be retrieved by the reference `id`

```js
{
	"id": "jsdemo",
	"source": "src/js",
	"destination": "dist/js",
	"virtualpath":"/public/js",
	"bundles":[...]
}
```

 * `source<String>` -> folder where the assets files are contained
 * `destination<String>` -> folder where the bundles output is generated
 * `virtualpath<String>` -> URL part used by the destination file on the client
 * `bundles<Array>` -> list of bundles that refer to the same `source`, `destination` and `virtualpath`

#### bundles

Files specified in the bundle `assets` will be treated in the exact same order that they are provided.  

```js
{
	"id": "demo-bundle-A",
	"options": {"no-min":true,"no-create":false},
	"assets": [
		{"type": "files", "src": ["demo-file-A.js","demo-file-B.js"]}
	]
}
```

 * `id<String>` -> unique identifier for a bundle, it is also used as the file name for the destination output
 * `options.no-min<Boolean|default:false>` -> prevent minification of the file assets used in the bundle
 * `options.no-create<Boolean|default:false>` -> prevent minification of the file assets used in the bundle
 * `assets<Array>` -> list of assets included in a bundle

#### assets

Assets in a bundle use the property `type` to indentify whether to look for new `files` or files inside existing `bundles`.

 * `files` -> list of files related to the bundle reference `source`
 * `bundles` -> list of bundles linked by `reference_id.bundle_id`

### Example

```js
{
	"id": "jsdemo",
	"source": "src/js",
	"destination": "dist/js",
	"virtualpath":"/public/js",
	"bundles":[
		{
			"id": "bundle-A"
			, "options": {"no-min":true,"no-create":true}
			, "assets": [
				{"type": "files", "src": ["demo-file-A.js","demo-file-B.js"]}
			]
		},
		{
			"id": "bundle-B"
			, "options": {}
			, "assets": [
				{"type": "bundles", "src": ["jsdemo.demo-bundle-A"]},
				{"type": "files", "src": ["demo-file-C.js"]}
			]
		},
		{
			"id": "bundle-C"
			, "options": {}
			, "assets": [
				{"type": "files", "src": ["demo-file-C.js"]},
				{"type": "bundles", "src": ["jsdemo.demo-bundle-A"]}
				
			]
		}
	]
}
```

The files used to generate the destination output will concatenate as follows

|BUNDLES|OUTPUT|FILES|REFERENCES|
|:-------|:------|:-----|-----------------:|
|jsdemo.bundleA|NONE|src/js/fileA.js|NONE|
|||src/js/fileB.js|NONE|
|jsdemo.bundleB|dist/js/bundleB.min.js|src/js/fileA.js|jsdemo.bundleA|
|||src/js/fileB.js|jsdemo.bundleA|
|||	src/js/fileC.js|NONE|
|jsdemo.bundleC|dist/js/bundleC.min.js|src/js/fileC.js|NONE|
|||	src/js/fileA.js|jsdemo.bundleA|
|||	src/js/fileB.js|jsdemo.bundleA|
The file `fileC.js` is used at the bottom in `bundleB` and at the top `bundleC`.

### Key Notes
 * a bundle is a group of file
 * files can use relative paths
 * a bundle can refer to other bundles as well
 * bundles in a reference and references themselves can follow any order 
 * the order of bundles and files in the bundle assets is reflected in the bundle ouput
 * a file that is included twice in the bundle assets will only be included at it's first occurence to avois duplications
 * every file in a bundle that has `option.no-min` set to `true` will never be minified for other bundles that include the same file
 * a bundle that has `option.no-create` set to `true` will only serve as a repository for other bundles
 * `option.no-min` does not apply on stylesheets
 * `virtualpath` is only used for logging
 
## Commands

assets-manager uses Grunt tasks to generate output files. Each task can be executed alone or included in a registered task.
Any task need `--config` to be specified in order to define which configuration file should be used. Its value can be a file location or any of the `id` in assets-manager-default.json to use the related file location

### Tasks

 * `uglify` -> runs on 'javascripts' bundles, creates `.temp` folders in each source file directory and stores a minified version for each asset
 * `concat:dist` -> runs on 'javascripts' bundles, uses the minified assets to store each bundle outuput in its `destination` folder 
 * `concat:original` -> runs on 'javascripts' bundles, uses the original assets to store each bundle outuput in its `destination` folder
 * `clean --force` -> runs on 'javascripts' bundles, removes the `.temp` folders generated by `uglify`, `--force` is required to grant the permission
 * `cssmin` -> runs on 'stylesheets' bundles, stores concatenated and minified bundle outputs in their `destination` folders
 * `watch` -> start watchers over files in bundles not flagged as `options.no-create` equal to `true`
 
To run a single task:

```shell
assets-manager\$ grunt <task_name> --config=<configuration_file> --force
```

### Registered Tasks

A ragistered task is a sequence of tasks. The global registered tasks are:

 * `default` -> `clean` + `uglify` + `concat:dist` + `cssmin` + `clean`
 * `keep` -> `clean` + `uglify` + `concat:dist` + `cssmin`
 * `complete` -> `clean` + `uglify` + `concat:dist` + `concat:original` + `cssmin` + `clean`
 * `completekeep` -> `clean` + `uglify` + `concat:dist` + `concat:original` + `cssmin`

In addition to the global (js+css) registered tasks above, the following apply on javascripts only.

 * `js` -> `clean` + `uglify` + `concat:dist` + `clean`
 * `jskeep` -> `clean` + `uglify` + `concat:dist`
 * `jscomplete` -> `clean` + `uglify` + `concat:dist` + `concat:original` + `clean`
 * `jscompletekeep` -> `clean` + `uglify` + `concat:dist` + `concat:original`

Registered tasks run alike any other task.

```shell
assets-manager\$ grunt <registered_task_name> --config=<configuration_file> --force
``` 
if the `registered_task_name` is not specified the command will execute `default`

### Logging

Whenever a task is executed, a new log file is generated. A log file displays all the assets used to generate a bundle and provides HTML include snippets to quickly replace a bundle with its source while developing. 
Log files are stored using the pattern `log\assets-<configuration_filename>.txt`.
 
