var gulp = require('gulp');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('just-serve', function(done) {
  browserSync({
    open: false,
    port: 9000,
    server: {
      baseDir: ['.'],
      middleware: function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});

gulp.task('serve', function(done) {
  return runSequence(
    'build',
    ['just-serve'],
    done
  );
});
