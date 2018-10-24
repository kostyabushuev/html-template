### Commands
**npm run dev** - start watcher and build project files
**npm run devremote** - start watcher and build project files. after save files its deploy to remote server
**npm run ftpdeploy** - deploy files to servet using ftp

available keys:
  **--nobabel** - off js transpilation
  **--nostylelint** - off stylelint
  **--noeslint** - off eslint
  **--remote** - data of remote server
  **--proxy** - use browser's sync proxy
  **--open** - openbrowser after starting
  **--minifyjs** - minify js-files at the compiling time
  **--files** - require key for rsyncdeploy task. Takes follow params: css,js,img,fonts, all. All param send to remote all files of build folder (including html file)
  **--preset** - require key for rsyncdeploy task. Takes param of preset from your projectconfig. See this one example below.

### Project config
It a json-file has preset for your project. Below you can see all available settings:
`
{
  "ftp": {
    "host": "youhostname.com",
    "port": "21",
    "user": "username",
    "password": "password",
    "path": "/path/to/folder"
  },
  "proxy": {
    "target": "example.com"
  },
  "rsync": {
    "presets": {
      "local": {
        "hostname": null,
        "destination": "/home/Desktop/"
      },
      ...
    }
  }
}
`
