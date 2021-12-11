// 实现这个项目的构建任务
const { series, src, dest, parallel,watch } = require("gulp");
const del = require("del");
const gulpLoadPlugins = require("gulp-load-plugins");
const plugins = gulpLoadPlugins();
const sass = plugins.sass(require("sass"));
const browserSync = require("browser-sync");
const bs = browserSync.create();
//定义模板解析规则
const data = {
  menus: [
    {
      name: "Home",
      icon: "aperture",
      link: "index.html",
    },
    {
      name: "Features",
      link: "features.html",
    },
    {
      name: "About",
      link: "about.html",
    },
    {
      name: "Contact",
      link: "#",
      children: [
        {
          name: "Twitter",
          link: "https://twitter.com/w_zce",
        },
        {
          name: "About",
          link: "https://weibo.com/zceme",
        },
        {
          name: "divider",
        },
        {
          name: "About",
          link: "https://github.com/zce",
        },
      ],
    },
  ],
  pkg: require("./package.json"),
  date: new Date(),
};

/*******************************************************必要更新任务********************************/

/**样式文件编译任务 */
//前置：需要gulp-sass、sass
//目标：sass样式编译成css并输出到dist文件
//优化：指定base:src,保证输出接口与src目录下的结构一致
const styles = () => {
  return src("src/assets/styles/*.scss", { base: "src" })
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(dest("dist"))
    .pipe(bs.reload({ stream: true }));
};

/**html页面任务 */
const pages = () => {
  return src("src/**/*.html", { base: "src" })
    .pipe(
      plugins.swig({
        data,
        defaults: {cache:false}
      })
    )
    .pipe(dest("dist"));
};

/**scripts脚本任务 */
const scripts = () => {
  return src("src/assets/scripts/*.js", { base: "src" })
    .pipe(
      plugins.babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(dest("dist"))
    .pipe(bs.reload({ stream: true }));
};

/**useref任务 */
const useref = () => {
  return src("dist/**/*.html")
    .pipe(plugins.useref({ searchPath: ["dist", "."] }))
    .pipe(plugins.if("*.js", plugins.uglify())) //压缩js文件
    .pipe(plugins.if("*.css", plugins.cleanCss())) //压缩css文件
    .pipe(
      plugins.if(
        "*.html",
        plugins.htmlmin({
          collapseWhitespace: true, //折叠空白符
          minifyCSS: true, //压缩style标签中的css
          minifyJS: true, //压缩script标签中的js
        })
      )
    )
    .pipe(dest("dist"));
};

/********************************************非必要更新任务**************************************/

/**images任务 */
const images = () => {
  return src("src/assets/images/**", { base: "src" })
    .pipe(plugins.imagemin())
    .pipe(dest("dist"))
    .pipe(bs.reload());
};

/**fonts任务 */
const fonts = () => {
  return src("src/assets/fonts/**", { base: "src" })
    .pipe(plugins.imagemin())
    .pipe(dest("dist"))
    .pipe(bs.reload());
};

/**其他任务 public中的文件原原样 */
const extra = () => {
  return src("public/**", { base: "public" }).dest("dist");
};

/**文件清除任务 删除构建完成的文件 */
const clean = () => {
  return del("dist");
};

/**********************************************开发服务器****************************/

const server = () => {

  /***必要内容更新监听 */
  watch('src/assets/styles/*.scss', styles);
  watch('src/assets/scripts/*.js', scripts);
  watch('src/*.html', pages);

  watch([
    "src/assets/images/**",
    'src/assets/fonts/**',
    "src/**/*.html"
  ], bs.reload);

  bs.init({
    notify: false, //是否每次更新内容都弹出提示
    port: 8089, // 指定端口号
    open: true, // 运行服务是否自动打开浏览器
    files: "dist/**", //监听路径 当前路径下的文件发生变化时，会触发更新
    server: {
      baseDir: ["dist", "src", "public"],
      routes: {
        "/node_modules": "node_modules", // 文件映射
      },
    },
  });
};

/*********************************************组合任务****************************************/

//组合任务 编译任务
const compile = parallel(styles, scripts, pages);

//组合任务  开发任务
const dev = series(clean, compile, server);

// 组合任务 build任务
const build = series(
  clean,
  parallel(series(compile, useref), images, fonts, extra)
);
module.exports = {
  compile,
  build,
  dev,
};
