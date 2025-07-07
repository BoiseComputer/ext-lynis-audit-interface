const { getWebpackConfig } = require('@plesk/plesk-ext-sdk/lib/webpack');

module.exports = (env, argv) => {
    const config = getWebpackConfig(env, argv);

    // Add CSS loader for .css files
    config.module.rules.push({
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
    });

    return config;
};
