module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({

    clean: ["dist"],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.ts', '!**/*.scss'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: ['README.md'],
        dest: 'dist'
      },
      dist_src: {
        cwd: 'dist/src',
        expand: true,
        src: ['*.js*'],
        dest: 'dist'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*'],
        tasks: ['default'],
        options: {spawn: false}
      }
    },

    ts: {
      build: {
        tsconfig: 'tsconfig.json',
        src: ["src/**/*.ts", "spec/**/*.ts"],
        outDir: "dist"
      }
    },

    // babel: {
    //   options: {
    //     sourceMap: true,
    //     presets: ['env'],
    //     plugins: ['transform-object-rest-spread']
    //   },
    //   distTestNoSystemJs: {
    //     files: [{
    //       cwd: 'src',
    //       expand: true,
    //       src: ['**/*.js'],
    //       dest: 'dist/test',
    //       ext: '.js'
    //     }]
    //   },
    //   distTestsSpecsNoSystemJs: {
    //     files: [{
    //       expand: true,
    //       cwd: 'spec',
    //       src: ['**/*.js'],
    //       dest: 'dist/test/spec',
    //       ext: '.js'
    //     }]
    //   }
    // },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['dist/spec/*_spec.js']
      }
    }
  });

  grunt.registerTask('default', [
    'clean', 
    'copy:src_to_dist', 
    'copy:pluginDef', 
    'ts:build', 
    'copy:dist_src', 
    // 'babel',
    'mochaTest'
  ]);
};
