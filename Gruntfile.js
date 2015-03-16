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
        src: ['public/js/jquery.hotkeys.js', 'public/js/angular-init.js', 'public/js/ng-infinite-scroll.min.js',
      		'public/js/angular-lazy-img.js', 'public/js/angular-directive.js', 'public/js/angular-filter.js',
      		'public/js/angular-controller.js'],
        dest: 'public/js/temp.js'
      },
      all: {
        src: ['public/js/jquery.min.js', 'public/js/angular.min.js',
        'public/js/ng-infinite-scroll.min.js', '<%= uglify.dist.dest %>'],
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
    clean: ['<%= uglify.dist.dest %>', '<%= concat.dist.dest %>'],
    watch: {
      gruntfile: {
        files: ['<%= concat.dist.src %>'],
        tasks: ['concat:dist', 'uglify:dist', 'concat:all', 'clean']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task.
  grunt.registerTask('default', ['concat:dist', 'uglify:dist', 'concat:all', 'clean']);

};
