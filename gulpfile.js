const gulp = require('gulp')
const gutil = require('gulp-util' )
const scss = require('gulp-sass')
const browserSync = require('browser-sync')
const autoprefixer = require('gulp-autoprefixer')
const ftp = require('vinyl-ftp')
const notify = require('gulp-notify')
const rsync = require('gulp-rsync')
const eslint = require('gulp-eslint')
const babel = require('gulp-babel')
const plumber = require('gulp-plumber')
const del = require('del')
const imagemin = require('gulp-imagemin')
const cached = require('gulp-cached')
const htmlhint = require('gulp-htmlhint')
const gulpStylelint = require('gulp-stylelint')
const fileinclude = require('gulp-file-include')
const uglify = require('gulp-uglify')
const sourcemaps = require('gulp-sourcemaps')
const args = require('yargs').argv
const pc = require('./projectconfig.json')
const tap = require('gulp-tap')
const ftpConnection = getFtpConnection()

const bsPreset = (function () {
  if (args.proxy) {
    return {
      proxy: {
        target: pc.proxy.target
      },
      open: !!args.open
    }
  } else {
    return {
      server: {
        baseDir: 'app'
      },
      open: !!args.open,
      notify: false,
    }
  }
})()

gulp.task('browser-sync', function () {
  browserSync(bsPreset)
})

gulp.task('html', function () {
  return gulp.src('app/html/*.html')
    .pipe(plumber(() => {}))
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.failOnError())
    .on('error', function (error) {
    /* eslint-disable-next-line */
      console.log(error.message)
    })
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .on('error', notify.onError({
      title: 'Error including html-file',
      message: '<%= error.message %>',
    }))
    .pipe(gulp.dest('app/'))
    .pipe(browserSync.reload({stream: true}))
})

gulp.task('stylelint', function () {
  /* off stylelint */
  if (args.nostylelint) {
    return false
  }

  return gulp.src('app/scss/**/*.scss')
    .pipe(cached())
    .pipe(gulpStylelint({
      failAfterError: false,
      reporters: [
        {formatter: 'string', console: true},
      ],
    }))
})

gulp.task('scss', ['stylelint'], function () {
  let src = gulp.src('app/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
    .pipe(cached())
    .pipe(autoprefixer(['last 15 version']))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('app/css/compiled'))

  if (args.remote) {
    src.pipe(tap((file) => {
      sendToRemote(file.path, ftpConnection)
    }))

    return src
      .pipe(browserSync.reload({stream: true}))
  } else {
    return src
      .pipe(browserSync.reload({stream: true}))
  }
})

gulp.task('eslint', function () {
  if (args.noeslint) {
    return false
  }

  return gulp.src(['app/js/custom/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.results((results) => {
      /* eslint-disable-next-line */
      console.log(`Total Results: ${results.length}`)
      /* eslint-disable-next-line */
      console.log(`Total Warnings: ${results.warningCount}`)
      /* eslint-disable-next-line */
      console.log(`Total Errors: ${results.errorCount}`)
    }))
})

gulp.task('js', ['eslint'], function (event, val) {
  let src = gulp.src(['app/js/custom/**/*.js'])
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))

  if (!args.nobabel) {
    src = babelTranspilation(src)
  }

  if (args.minifyjs) {
    src = src.pipe(uglify())
  }

  if (args.remote) {
    let blobArr = []

    src.pipe(tap((file) => {
      blobArr.push(file.path)

      sendToRemote(blobArr, ftpConnection)

      return src
        .pipe(gulp.dest('app/js/compiled'))
        .pipe(browserSync.reload({stream: true}))
    }))
  }

  return src
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
    .pipe(cached(imagemin()))
    .pipe(gulp.dest('build/img'))
})

gulp.task('removebuild', function () {
  return del.sync('build')
})

gulp.task('build', ['removebuild', 'imagemin', 'html', 'scss', 'js'], function () {
  /* eslint-disable-next-line */
  let buildFiles = gulp.src([
    'app/*.html',
    'app/.htaccess',
    'app/*.php',
    ]).pipe(gulp.dest('build'))

  /* eslint-disable-next-line */
  let buildCss = gulp.src([
    'app/css/**/*',
    ]).pipe(gulp.dest('build/css'))

  /* eslint-disable-next-line */
  let buildImg = gulp.src([
    'app/img/**/*',
    ])
    .pipe(gulp.dest('build/img'))

  /* eslint-disable-next-line */
  let buildJs = gulp.src([
    '!app/js/custom/**/*',
    'app/js/**/*',
    ]).pipe(gulp.dest('build/js'))

  // /* eslint-disable-next-line */
  let buildFonts = gulp.src([
    'app/fonts/**/*',
    ]).pipe(gulp.dest('build/fonts'))
})

gulp.task('rsyncdeploy', function () {
  return gulp.src('build/**')
    .pipe(rsync({
      root: 'build/',
      hostname: 'username@yousite.com',
      destination: 'yousite/public_html/',
      archive: true,
      silent: false,
      compress: true
    }))
})

gulp.task('rsyncdeploy', function () {
  const filesArr = args.files.split(',')
  const preset = pc.rsync.presets[args.preset]

  let pathArr = []

  for (let i = 0; i < filesArr.length; i++) {
    switch (filesArr[i]) {
      case 'css':
        pathArr.push('build/css/**/*.css')

        break
      case 'js':
        pathArr.push('build/js/compiled/**/*.js', 'build/js/libs/*.js')

        break
      case 'img':
        pathArr.push('build/img/**/*')

        break
      case 'fonts':
        pathArr.push('build/fonts/**/*')

        break
      case 'all':
        filesArr.length = 0
        pathArr = 'build/**/*'

        break
    }
  }

  return gulp.src(pathArr)
    .pipe(rsync({
      root: 'build/',
      hostname: preset.hostname,
      destination: preset.destination,
      archive: true,
      silent: false,
      compress: true,
    }))
})

gulp.task('ftpdeploy', ['build'], function () {
  let conn = getFtpConnection()

  let globs = [
    'dist/**',
    'dist/.htaccess',
  ]

  sendToRemote(globs, conn)
})

function getFtpConnection () {
  return ftp.create({
    host: pc.ftp.host,
    port: pc.ftp.port,
    user: pc.ftp.user,
    password: pc.ftp.password,
    parallel: 5,
    log: gutil.log,
  })
}

function sendToRemote (globs, connection) {
  return gulp
    .src(globs, {base: './app', buffer: false})
    .pipe(connection.newer(pc.ftp.path))
    .pipe(connection.dest(pc.ftp.path))
}

function babelTranspilation (src) {
  return src
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
}
