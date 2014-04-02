var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var files = [ 'pre', 'var', 'util', 'depend', 'require', 'module', 'define', 'suf' ];
files.forEach(function(v, i) {
	files[i] = './src/' + v + '.js';
})

gulp.task('default', function() {
	gulp.src(files)
		.pipe(concat('panda.js'))
		.pipe(gulp.dest('./'))
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(gulp.dest('../amdjs-tests/impl/panda/'))
		;
});

gulp.task('compress', function() {
	gulp.src('./panda.js')
		.pipe(concat('panda-min.js'))
		.pipe(uglify({outSourceMap: true}))
		.pipe(gulp.dest('./'))
})