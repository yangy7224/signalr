/**
 * Created by yiyang1990 on 2019/2/26.
 */
module.exports = {
    watch: false,
    devtool: "source-map",
    resolve: {
        extensions: ['.js']
    },
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015']
            }
        }]
    }
};
