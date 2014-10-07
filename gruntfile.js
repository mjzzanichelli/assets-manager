var manager = require('./assets-manager');
var path = require('path');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  var banner = '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\r\n';
  var configFile = (function(config){
	  var default_configs = grunt.file.readJSON("assets-manager-default.json");
	  if (typeof default_configs === "object" && default_configs.configs !== undefined){
		 default_configs.configs.map(function(conf){
		 	if (config.toLowerCase()==conf.id.toLowerCase())config = path.normalize(conf.path);
		 });
	  }
	  return config;
 })(grunt.option('config'));
  
  console.log("-------------------------------");
  console.log("CONFIG file ->",configFile);
  console.log("-------------------------------");
  
  var assets = manager.set(grunt.file.readJSON(configFile));
  var scripts_assets = assets.minifyjs();
  
  grunt.file.write( "./log/assets-"+ path.basename(configFile, '.json').toLowerCase() +".txt", assets.content());
	
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
	  scripts: {
	    files: assets.watch("javascripts").concat([configFile,"gruntfile.js"]),
	    tasks: ['js'],
	    options: {
	      spawn: false,
	      reload: true,
	      forever:true
	    },
	  },
	  css: {
	    files: assets.watch("styles").concat([configFile,"gruntfile.js"]),
	    tasks: ['cssmin'],
	    options: {
    		spawn: false,
	      	reload: true,
	      	forever:true
	    },
	  }
	},
	clean: scripts_assets.temps,
	uglify: {
      options:{
		mangle:true
	  },
	  dist:{
        files:scripts_assets.files
      }
    },
    concat: {
      options: {separator: ';',stripBanners: true,banner: banner},
      dist: {files:assets.extract("javascripts","concatmin",scripts_assets.bundles)},
	  original: {files:assets.extract("javascripts","concat")}
    },
	cssmin: {
	  combine: {
		files: assets.extract("styles","min")
	  }
	}
  });
  grunt.registerTask('default', ['clean','uglify','concat:dist','cssmin','clean']);
  grunt.registerTask('keep', ['clean','uglify','concat:dist','cssmin']);
  grunt.registerTask('complete', ['clean','uglify','concat:dist','concat:original','cssmin','clean']);
  grunt.registerTask('completekeep', ['clean','uglify','concat:dist','concat:original','cssmin']);
  
  grunt.registerTask('js', ['clean','uglify','concat:dist','clean']);
  grunt.registerTask('jskeep', ['clean','uglify','concat:dist']);
  grunt.registerTask('jscomplete', ['clean','uglify','concat:dist','concat:original','clean']);
  grunt.registerTask('jscompletekeep', ['clean','uglify','concat:dist','concat:original']);
  
};