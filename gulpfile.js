/**
 * Created by yiyang1990 on 2019/2/25.
 */
const gulp = require('gulp');
const gulpBabel = require("gulp-babel");
const gulpMinify = require('gulp-minify');
const gulpWebpack = require('webpack-stream');
var webpackConfig = require('./webpack.config.js');

/** 默认任务。执行gulp或gulp default触发
 **/
gulp.task('default', async() => {

})

/** 默认任务。执行gulp或gulp default触发
 **/
gulp.task('build', async() => {
    gulp.src('./src/*.js')
        .pipe(gulpBabel())
        // .pipe(gulpWebpack(webpackConfig))
        .pipe(gulp.dest('dist'));
})