/// <reference path="manifest.d.ts" />

/**
 * @type {Exported.Manifest}
 */
let manifest = {
  // $schema: "https://json.schemastore.org/chrome-manifest",
  manifest_version: 3,
  name: "My Hentai List",
  description:
    "An extension that allows rating and saving nhentai doujinshi to a list.",
  version: "1.11.0",
  permissions: [
    "activeTab",
    "storage",
    "tabs",
    "unlimitedStorage",
    "contextMenus",
  ],
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0i6gmupcJuA/BfHfbGw7nGonwbp805OTk229PWajxDktH4hycn59Vhm2pMk0jTgil9jlyZn58MJCqxfELHBqaLjjkSK609a5IgnZhEmI/ni0lCZkrGaQBH/7CeUIb/sbr9js6nDQpLgomODTwNGZvwI5L6MzHrxQHRM0LKG3qRlPbWWyFCQBTrvzs2bgnyYSy6pqACcBdfuzLnzOiSCqTvb1R6f3og7L+tqh3Ghz6H33U406mDUT4pnmh/AXVkA+MmZugr6IlAvuerSOSoJC1vpR47AuuLKlcMLrXQ+jHaFQ7p+dlmh15UAepENRLn9LjfUILFxDQxT21UkS43mpOQIDAQAB",
  content_scripts: [
    {
      js: ["scripts/ratingInjector.js"],
      matches: ["https://nhentai.net/g/*"],
      run_at: "document_end",
    },
    {
      js: ["scripts/galleryInjector.js"],
      matches: ["https://nhentai.net/*"],
      run_at: "document_end",
    },
    {
      js: ["scripts/infoGetter.js"],
      matches: ["https://nhentai.net/g/*"],
      run_at: "document_end",
      world: "MAIN",
    },
    {
      js: ["scripts/censor.js"],
      matches: ["https://nhentai.net/*"],
      run_at: "document_start",
    },
    {
      js: ["scripts/react.js"],
      matches: ["https://nhentai.net/*"],
      run_at: "document_start",
    },
    {
      js: ["scripts/react-dom.js"],
      matches: ["https://nhentai.net/*"],
      run_at: "document_start",
    },
  ],

  web_accessible_resources: [
    {
      resources: ["/assets/*"],
      matches: ["<all_urls>"],
    },
    {
      resources: ["/lib/*"],
      matches: ["<all_urls>"],
    },
    // {
    //     "resources": [
    //         "/scripts/*"
    //     ],
    //     "matches": [
    //         "<all_urls>"
    //     ],
    //     "use_dynamic_url": false
    // }
  ],
  icons: {
    16: "assets/favicon/favicon16.png",
    32: "assets/favicon/favicon32.png",
    48: "assets/favicon/favicon48.png",
    64: "assets/favicon/favicon64.png",
    128: "assets/favicon/favicon128.png",
  },
  action: {
    default_title: "See saved doujinshi",
    default_popup: "popup.html",
  },
  background: {
    service_worker: "scripts/background.js",
  },
};
module.exports = manifest;
