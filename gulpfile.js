const gulp = require('gulp')
const gutil = require('gulp-util' )
const scss = require('gulp-sass')
const browserSync = require('browser-sync')
const autoprefixer = require('gulp-autoprefixer')
const ftp = require('vinyl-ftp')
const notify = require('gulp-notify')
const rsync = require('gulp-rsync')
const rigger = require('gulp-rigger')
const babel = require('gulp-babel')
const plumber = require('gulp-plumber')
const del = require('del')
const imagemin = require('gulp-imagemin')
const cache = require('gulp-cache')
const htmlhint = require('gulp-htmlhint')
const gulpStylelint = require('gulp-stylelint')

gulp.task('browser-sync', function () {
  browserSync({
    server: {
      baseDir: 'app',
    },
    notify: false,
  })
})

gulp.task('html', function () {
  return gulp.src('app/html/*.html')
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter())
    .pipe(rigger())
    .pipe(gulp.dest('app/'))
    .pipe(browserSync.reload({stream: true}))
})

gulp.task('scss', function () {
  return gulp.src('app/scss/**/*.scss')
  .pipe(gulpStylelint({
    failAfterError: false,
    reporters: [
      {formatter: 'string', console: true},
    ],
  }))
  .pipe(scss({outputStyle: 'compressed'}))
  .on('error', notify.onError({
    title: 'Error compilation scss-file',
    message: '<%= error.message %>',
  }))
  .pipe(autoprefixer(['last 15 versions']))
  .pipe(gulp.dest('app/css/compiled'))
  .pipe(browserSync.reload({stream: true}))
})

gulp.task('js', function () {
  return gulp.src(['app/js/custom/**/*.js'])
  .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
  .pipe(babel({
    presets: ['@babel/preset-env']
  }))
  .pipe(gulp.dest('app/js/compiled'))
  .pipe(browserSync.reload({stream: true}))
})

gulp.task('watch', ['html', 'scss', 'js', 'browser-sync'], function () {
  gulp.watch('app/html/**/*.html', ['html'])
  gulp.watch('app/scss/**/*.scss', ['scss'])
  gulp.watch('app/js/custom/**/*.js', ['js'])
  gulp.watch('app/*.html', browserSync.reload)
})

gulp.task('imagemin', function () {
  return gulp.src('app/img/**/*')
    .pipe(cache(imagemin()))
    .pipe(gulp.dest('dist/img'))
})

gulp.task('removedist', function () {
  return del.sync('dist')
})

gulp.task('build', ['imagemin', 'html', 'removedist', 'scss', 'js'], function () {
  /* eslint-disable-next-line */
  let buildFiles = gulp.src([
    'app/*.html',
    'app/.htaccess',
    'app/*.php',
    ]).pipe(gulp.dest('dist'))

  /* eslint-disable-next-line */
  let buildCss = gulp.src([
    'app/css/**/*',
    ]).pipe(gulp.dest('dist/css'))

  /* eslint-disable-next-line */
  let buildImg = gulp.src([
    'app/img/**/*',
    ]).pipe(gulp.dest('dist/img'))

  /* eslint-disable-next-line */
  let buildJs = gulp.src([
    'app/js/**/*',
    ]).pipe(gulp.dest('dist/js'))

  /* eslint-disable-next-line */
  let buildFonts = gulp.src([
    'app/fonts/**/*',
    ]).pipe(gulp.dest('dist/fonts'))
})

gulp.task('rsync', function () {
  return gulp.src('dist/**')
  .pipe(rsync({
    root: 'dist/',
    hostname: 'username@yousite.com',
    destination: 'yousite/public_html/',
    archive: true,
    silent: false,
    compress: true
  }))
})

gulp.task('deploy', function () {
  let conn = ftp.create({
    host: 'hostname.com',
    user: 'username',
    password: 'userpassword',
    parallel: 0,
    log: gutil.log
  })

  let globs = [
    'dist/**',
    'dist/.htaccess',
  ]
  return gulp.src(globs, {buffer: false})
  .pipe(conn.dest('/path/to/folder/on/server'))
})
