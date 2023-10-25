import path from "path";
import { cp } from "fs/promises";
import {
  readdirSync,
  lstatSync,
  mkdir,
  mkdirSync,
  existsSync,
  writeFile,
  writeFileSync,
  rmSync,
  readFileSync,
} from "fs";
import { ProvidePlugin } from "webpack";
import WatchExternalFilesPlugin from "webpack-watch-files-plugin";
import TerserPlugin from "terser-webpack-plugin";
import HtmlMinimizerPlugin from "html-minimizer-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import WebpackRequireFrom from "webpack-require-from";

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
            } else if (from.match(/manifest.js/))
              copies.push(
                new Promise((resolve) => {
                  let content = require(fromPath);
                  console.log("\n\n\n\n\n----------------------------------");
                  console.log("JS to JSON");
                  console.log("fromPath", fromPath);
                  console.log("content", content);
                  console.log("----------------------------------\n\n\n\n\n");

                  let json;
                  if (this.shouldMinifyJson) json = JSON.stringify(content);
                  else json = JSON.stringify(content, null, 2);
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
            else copies.push(cp(fromPath, toPath, { recursive: true }));
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
  externals: {
    react: "React", // Case matters here
    "react-dom": "ReactDOM", // Case matters here
  },
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
    // new WebpackRequireFrom({
    //   path: "chrome-extension://afgbncbjcffbhpemdhocimfjcbblieaf/scripts/",
    // }),
    new WatchExternalFilesPlugin({
      files: ["./src/**/*"],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/popup.html"),
          to: path.resolve(__dirname, "dist/popup.html"),
        },
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      // chunks: "all",
      // minSize: 0,
      // minSizeReduction: 1,
      // name: (module, chunks, cacheGroupKey) => {
      //   const allChunksNames = chunks
      //     .map((chunk) => {
      //       let _regClean = (str) => {
      //         let res = str[0].toLowerCase();
      //         for (let i = 1; i < str.length; i++)
      //           if (/[A-Z]/.test(str[i])) res += str[i].toLowerCase();
      //         return res;
      //       };
      //       return _regClean(chunk.name);
      //     })
      //     .join(".");
      //   return `../chunks/${allChunksNames}`;
      // },
    },
  },
};

module.exports = (env, argv) => {
  let copier = new MyFileCopier([
    {
      from: "src/manifest.js",
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
    { from: "src/lib/react-dom.js", to: "dist/scripts/react-dom.js" },
    { from: "src/lib/react.js", to: "dist/scripts/react.js" },
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
    if (existsSync(path.resolve(__dirname, "dist"))) {
      console.log("Removing dist folder...");
      rmSync(path.resolve(__dirname, "dist"), { recursive: true });
    }
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
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: path.resolve(__dirname, "bundle-report.html"),
          openAnalyzer: false,
          defaultSizes: "gzip",
        }),
      ],
    };

    copier.setShouldMinifyJson(true);
  }

  return { ...config, plugins: [...config.plugins, copier] };
};
