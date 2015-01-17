module.exports = function(grunt){
  
  grunt.loadNpmTasks('grunt-mocha-test');
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          //captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false,
          require: 'coverage/blanket'
        },
        src: ['tests/**/*.js']
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'coverage.html'
        },
        src: ['tests/**/*.js']
      }
      
    }
  });
  
  grunt.registerTask('default', ['mochaTest']);
};