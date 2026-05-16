/// <reference types="node" />

import webpack from "webpack";
import GasPlugin from "gas-webpack-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: webpack.Configuration = {
  mode: "production",

  entry: "./src/Code.ts",

  output: {
    path: path.resolve(dirname, "dist"),
    filename: "main.js",
    libraryTarget: 'this',
    clean: true,
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new GasPlugin({
      autoGlobalExportsFiles: ["src/Code.ts"],
    }),
  ],

  optimization: {
    minimize: true,
    concatenateModules: true,
  },

  devtool: false,
};

export default config;
