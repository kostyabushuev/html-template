let gulp           = require('gulp'),
		gutil          = require('gulp-util' ),
		scss           = require('gulp-sass'),
		browserSync    = require('browser-sync'),
		cleanCSS       = require('gulp-clean-css'),
		autoprefixer   = require('gulp-autoprefixer'),
		ftp            = require('vinyl-ftp'),
		notify         = require("gulp-notify"),
		rsync          = require('gulp-rsync'),
		rigger         = require('gulp-rigger'),
		babel          = require('gulp-babel')
		plumber        = require('gulp-plumber')

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app',
		},
		notify: false,
	});
});

gulp.task('html', function () {
	return gulp.src('app/html/*.html')
		.pipe(rigger())
		.pipe(gulp.dest('app/'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('scss', function() {
	return gulp.src('app/scss/**/*.scss')
	.pipe(scss({outputStyle: 'expand'}).on("error", notify.onError()))
	.pipe(autoprefixer(['last 15 versions']))
	//.pipe(cleanCSS()) // Опционально, закомментировать при отладке
	.pipe(gulp.dest('app/css/custom'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('js', function() {
	return gulp.src(['app/js/custom/**/*.js',])
	.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
	.pipe(babel({
		presets: ['@babel/preset-env']
	}))
	.pipe(gulp.dest('app/js/compiled'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['html', 'scss', 'js', 'browser-sync'], function() {
	gulp.watch('app/html/**/*.html', ['html']);
	gulp.watch('app/scss/**/*.scss', ['scss']);
	gulp.watch('app/js/custom/**/*.js', ['js']);
	gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('deploy', function() {

	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});

	var globs = [
	'dist/**',
	'dist/.htaccess',
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('rsync', function() {
	return gulp.src('dist/**')
	.pipe(rsync({
		root: 'dist/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		archive: true,
		silent: false,
		compress: true
	}));
});

gulp.task('default', ['watch']);
