var _ = require('underscore');

var gulp = require('gulp');
var rimraf = require('gulp-rimraf');
var concat = require('gulp-concat');

// Clean
gulp.task('clean', function (cb) {
  return gulp.src('dist', { read: false })
    .pipe(rimraf({ force: true }))
});

gulp.task('build', ['clean'], function(cb) {
  return gulp.src([
    './build/pre.js',
    './lib/common.js',
    './lib/date.js',
    './lib/relation.js',
    './lib/relation/has-many.js',
    './lib/relation/has-one.js',
    './lib/collection.js',
    './lib/model.js',
    './build/post.js'
  ]).pipe(concat('backbone-relationships.js')).pipe(gulp.dest('.'));
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['build/**/*.js', 'lib/**/*.js'], function() {
    gulp.run('build');
  });
});

gulp.task('default', ['build']);
