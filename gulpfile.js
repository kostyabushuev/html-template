let gulp = require('gulp')
let gutil = require('gulp-util' )
let scss = require('gulp-sass')
let browserSync = require('browser-sync')
let autoprefixer = require('gulp-autoprefixer')
let ftp = require('vinyl-ftp')
let notify = require('gulp-notify')
let rsync = require('gulp-rsync')
let rigger = require('gulp-rigger')
let babel = require('gulp-babel')
let plumber = require('gulp-plumber')

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
    .pipe(rigger())
    .pipe(gulp.dest('app/'))
    .pipe(browserSync.reload({stream: true}))
})

gulp.task('scss', function () {
  return gulp.src('app/scss/**/*.scss')
  .pipe(scss({outputStyle: 'compressed'}).on('error', notify.onError()))
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
