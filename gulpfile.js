let projectFolder = "dist",
    sourceFolder  = "src";

let fs = require('fs');

let path = {
  build: {
    html: projectFolder + "/",
    css: projectFolder + "/css/",
    js: projectFolder + "/js/",
    libs: projectFolder + "/libs/",
    img: projectFolder + "/img/",
    fonts: projectFolder + "/fonts/"
  },
  src: {
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
    css: sourceFolder + "/scss/main.scss",
    js: sourceFolder + "/js/**/*.js",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,webp,ico,gif}",
    fonts: sourceFolder + "/fonts/**/*.ttf"
  },
  watch: {
    html: sourceFolder + "/**/*.html",
    css: sourceFolder + "/scss/**/*.scss",
    js: sourceFolder + "/js/**/*.js",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,webp,ico,gif}"
  },
  clean: "./" + projectFolder + "/"
};

let { src, dest } = require('gulp'),
  gulp            = require('gulp'),
  browsersync     = require('browser-sync').create(),
  fileinclude     = require('gulp-file-include'),
  del             = require('del'),
  scss = require('gulp-sass')(require('sass')),
  autoprefixer    = require('gulp-autoprefixer'),
  groupMedia      = require('gulp-group-css-media-queries');
  cleanCss        = require('gulp-clean-css'),
  rename          = require('gulp-rename'),
  uglify          = require('gulp-uglify-es').default,
  imagemin        = require('gulp-imagemin'),
  svgsprite       = require('gulp-svg-sprite'),
  ttf2woff        = require('gulp-ttf2woff'),
  ttf2woff2       = require('gulp-ttf2woff2'),
  fonter          = require('gulp-fonter'),
  concat          = require('gulp-concat');


function browserSync() {
  browsersync.init({
    server: {
      baseDir: "./" + projectFolder + "/"
    },
    port: 3000,
    notify: false
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(scss({
      outputStyle: "expanded"
    }))
    .pipe(groupMedia())
    .pipe(autoprefixer({
      overrideBrowserslist: ["last 5 versions"],
      cascade: true
    }))
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(rename({
      extname: ".min.css"
    }))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function cssLibs() {
  return src([
    'bower_components/normalize.css/normalize.css'
  ])
  .pipe(concat('libs.min.css'))
  .pipe(cleanCss())
  .pipe(dest(path.build.css))
}

function js() {
  return src(path.src.js)
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function jsLibs() {
  return src([
    'bower_components/jquery/dist/jquery.js'
  ])
  .pipe(concat('libs.min.js'))
  .pipe(uglify())
  .pipe(dest(path.build.libs))
}

function images() {
  return src(path.src.img)
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{
        removeViewBox: false
      }],
      interlaced: true,
      optimizationLevel: 3
    }))
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}

gulp.task('otf2ttf', function () {
  return gulp.src([sourceFolder + '/fonts/*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(sourceFolder + '/fonts/'))
});

function svgSprite() {
  return src([sourceFolder + '/iconssprite/*.svg'])
  .pipe(svgsprite({
    mode: {
      stack: {
        sprite: "../icons/sprite.svg",
        example: false
      }
    }
  }))
  .pipe(dest(path.build.img))
}

function fontsStyle(params) {
  let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean() {
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts, cssLibs, jsLibs), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.jsLibs = jsLibs;
exports.svgSprite = svgSprite;
exports.cssLibs = cssLibs;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;