import path from "path";
import { copyFile } from "fs/promises";
import {
  readdirSync,
  lstatSync,
  mkdir,
  mkdirSync,
  existsSync,
  writeFile,
  writeFileSync,
} from "fs";
import { ProvidePlugin } from "webpack";
import WatchExternalFilesPlugin from "webpack-watch-files-plugin";
import TerserPlugin from "terser-webpack-plugin";
import HtmlMinimizerPlugin from "html-minimizer-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

class MyFileCopier {
  constructor(options) {
    this.options = options;
  }

  shouldMinifyJson = false;
  setShouldMinifyJson(v) {
    this.shouldMinifyJson = v;
  }

  // Define `apply` as its prototype method which is supplied with compiler as its argument
  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise(
      "My File Copier",
      (
        stats /* stats is passed as an argument when done hook is tapped.  */
      ) => {
        return new Promise((resolve, reject) => {
          console.log("Copying files...");

          if (!this.options) throw new Error("options are required");

          let copies = [];

          let _copy = (from, to) => {
            if (!from || !to)
              throw new Error("from and to options are required");
            let fromPath = path.resolve(__dirname, from);
            let toPath = path.resolve(__dirname, to);
            console.log(`Copying ${fromPath} to ${toPath}`);
            if (lstatSync(fromPath).isDirectory()) {
              if (!existsSync(toPath)) mkdirSync(toPath, { recursive: true });
              for (let file of readdirSync(fromPath))
                _copy(`${fromPath}/${file}`, `${toPath}/${file}`);
            } else if (from.endsWith(".json") && this.shouldMinifyJson)
              copies.push(
                new Promise((resolve) => {
                  let content = require(fromPath);
                  let json = JSON.stringify(content);
                  mkdirSync(path.dirname(toPath), { recursive: true });
                  writeFileSync(toPath, json, { encoding: "utf8" });

                  console.log(
                    `Minified ${fromPath} (${
                      lstatSync(fromPath).size
                    } bytes) to ${toPath} (${lstatSync(toPath).size} bytes)`
                  );
                  resolve();
                })
              );
            else copies.push(copyFile(fromPath, toPath));
          };

          if (Array.isArray(this.options))
            this.options.forEach((option) => _copy(option.from, option.to));
          else _copy(this.options.from, this.options.to);

          Promise.all(copies)
            .then(() => {
              console.log("Files copied");
              resolve();
            })
            .catch(reject);
        });
      }
    );
  }
}

function getDirEntries(path) {
  return readdirSync(path)
    .filter(
      (file) =>
        !file.endsWith(".d.ts") &&
        (file.endsWith(".ts") || file.endsWith(".tsx"))
      //|| file.endsWith(".html")
      // || file.endsWith(".json")
    )
    .map((file) => [file.replace(/\.tsx?$/, ""), `${path}/${file}`]);
}

var config = {
  entry: () => Object.fromEntries(getDirEntries("./src/scripts")),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ["ts-loader"],
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  devtool: "cheap-module-source-map",

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "scripts/[name].js",
    path: path.resolve(__dirname, "dist"),
    assetModuleFilename: "[name][ext]",
  },
  plugins: [
    new WatchExternalFilesPlugin({
      files: ["./src/**/*"],
    }),
  ],
};

module.exports = (env, argv) => {
  let copier = new MyFileCopier([
    {
      from: "src/manifest.json",
      to: "dist/manifest.json",
    },
    // {
    //   from: "src/popup.html",
    //   to: "dist/popup.html",
    // },
    {
      from: "src/assets",
      to: "dist/assets",
    },
  ]);
  if (argv.mode === "development")
    config = {
      ...config,
      watch: true,
      watchOptions: {
        poll: 1000,
        ignored: /node_modules/,
      },
      optimization: {
        minimize: false,
      },
    };
  else if (argv.mode === "production") {
    config = {
      ...config,
      optimization: {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              format: {
                comments: false,
              },
            },
          }),
          new HtmlMinimizerPlugin(),
        ],
      },
      plugins: [
        ...config.plugins,
        new CopyPlugin({
          patterns: [
            {
              from: "src/popup.html",
              to: "popup.html",
            },
          ],
        }),
      ],
    };

    copier.setShouldMinifyJson(true);
  }

  return { ...config, plugins: [...config.plugins, copier] };
};
