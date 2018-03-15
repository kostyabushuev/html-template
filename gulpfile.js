let gulp           = require('gulp'),
		gutil          = require('gulp-util' ),
		scss           = require('gulp-sass'),
		browserSync    = require('browser-sync'),
		concat         = require('gulp-concat'),
		uglify         = require('gulp-uglify'),
		cleanCSS       = require('gulp-clean-css'),
		del            = require('del'),
		cache          = require('gulp-cache'),
		autoprefixer   = require('gulp-autoprefixer'),
		ftp            = require('vinyl-ftp'),
		notify         = require("gulp-notify"),
		rsync          = require('gulp-rsync'),
		rigger         = require('gulp-rigger'),
		babel          = require('gulp-babel');

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app',
			directory: true
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

gulp.task('common-js', function() {
	return gulp.src(['app/js/custom/**/*.js',])
	.pipe(babel({
			presets: ['env']
	}))
	// .pipe(uglify()) выключить при отладке
	.pipe(gulp.dest('app/js/compilied'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['html', 'scss', 'common-js', 'browser-sync'], function() {
	gulp.watch('app/html/**/*.html', ['html']);
	gulp.watch('app/scss/**/*.scss', ['scss']);
	gulp.watch(['js/**/*.js',], ['common-js']);
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

gulp.task('removedist', function() { return del.sync('dist'); });
gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);
