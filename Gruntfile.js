/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['public/js/bootstrap-slider.js', 'public/js/jquery.hotkeys.js',
		'node_modules/jade/runtime.js', 'public/js/templates.js', 'public/js/utils.js',
		'public/js/jquery.store.js', 'public/js/jquery.player.js',
		'public/js/jquery.fastsearch.js', 'public/js/views.js','public/js/init.js'],
        dest: 'public/js/temp.js'
      },
      all: {
        src: ['public/js/modernizr.min.js', 'public/js/jquery.min.js', 'public/js/jquery.hammer-full.min.js',
        'public/js/bootstrap.min.js', '<%= uglify.dist.dest %>'],
        dest: 'public/js/<%= pkg.name %>.min.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'public/js/temp.min.js'
      }
    },
    jade: {
      compile: {
        options: {
          client: true,
          namespace: 'Templates'
        },
        files: {
          "public/js/templates.js": ["views/*.jade", "views/tab/*.jade"]
        }
      }
    },
    clean: ['<%= uglify.dist.dest %>', '<%= concat.dist.dest %>'],
    watch: {
      gruntfile: {
        files: '<%= concat.dist.src %>',
        tasks: ['jade', 'concat:dist', 'uglify:dist', 'concat:all', 'clean']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jade');

  // Default task.
  grunt.registerTask('default', ['jade', 'concat:dist', 'uglify:dist', 'concat:all', 'clean']);

};
