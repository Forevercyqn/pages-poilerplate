// 实现这个项目的构建任务
const { series, src, dest, parallel } = require("gulp");
const del = require("del");
const sass = require("gulp-sass")(require("sass"));
const babel = require("gulp-babel");
const swig = require("gulp-swig");
const useref = require("gulp-useref");
const GulpCleanCss = require("gulp-clean-css");
const gulpIf = require("gulp-if");
const GulpUglify = require("gulp-uglify");
const htmlmin = require("gulp-htmlmin");

//定义模板解析规则
const data = {
    menus: [{
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
            children: [{
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
        .pipe(dest("dist"));
};

/**html页面任务 */
const pages = () => {
    return src("src/**/*.html", { base: "src" })
        .pipe(
            swig({
                data,
            })
        )
        .pipe(useref({ searchPath: ["dist", "."] }))
        .pipe(gulpIf("*.js", GulpUglify())) //压缩js文件
        .pipe(gulpIf("*.css", GulpCleanCss())) //压缩css文件
        .pipe(
            gulpIf(
                "*.html",
                htmlmin({
                    collapseWhitespace: true, //折叠空白符
                    minifyCSS: true, //压缩style标签中的css
                    minifyJS: true, //压缩script标签中的js
                })
            )
        )
        .pipe(dest("dist"));
};

/**scripts脚本任务 */
const scripts = () => {
    return src("src/assets/scripts/*.js", { base: "src" })
        .pipe(
            babel({
                presets: ["@babel/env"],
            })
        )
        .pipe(dest("dist"));
};

/********************************************非必要更新任务**************************************/

/**文件清除任务 删除构建完成的文件 */
const clean = () => {
    return del("dist");
};

/*********************************************组合任务****************************************/

//组合任务 编译任务
const compile = series(clean, parallel(styles, scripts, pages));

module.exports = {
    compile,
};
