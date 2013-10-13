var fs = require('fs'),
    path = require('path'),
    nsg = require('node-sprite-generator'),
    logger = require('logmimosa'),
    wrench = require('wrench'),
    config = require('./config');

var _makeDirectory = function ( dir ) {
  if (!fs.existsSync(dir)) {
    logger.debug("Making folder [[ " + dir + " ]]")
    wrench.mkdirSyncRecursive(dir, 0777);
  }
}

var _buildSpriteConfig = function ( mimosaConfig, folderPath ) {

  // Get compiled path
  var spriteOutPath = folderPath.replace( mimosaConfig.watch.sourceDir, mimosaConfig.watch.compiledDir );

  // Get just the direectory name
  spriteOutPath = path.dirname( spriteOutPath );

  var folderName = path.basename( folderPath );

  // file name is folder name plus .png
  var spriteFileName = folderName + ".png";

  // build full output file
  var spriteOutFile = path.join( spriteOutPath, spriteFileName );

  var stylesheetOutFile = path.join( mimosaConfig.sprite.stylesheetDirFull, folderName );

  if (mimosaConfig.sprite.isStylus) {
    stylesheetOutFile = stylesheetOutFile + ".styl";
  } else {
    stylesheetOutFile = stylesheetOutFile + ".css";
  }

  var nsgConfig = {
    src: [path.join(folderPath, "*.png").replace(mimosaConfig.root + path.sep, "")],
    spritePath: spriteOutFile.replace(mimosaConfig.root + path.sep, ""),
    stylesheetPath: stylesheetOutFile.replace(mimosaConfig.root + path.sep, "")
  };

  if (mimosaConfig.sprite.commonDirFull) {
    nsgConfig.src.push(path.join(mimosaConfig.sprite.commonDirFull, "*.png").replace(mimosaConfig.root + path.sep, ""));
  }

  _makeDirectory(path.dirname(spriteOutFile));

  //console.log(nsgConfig);

  return nsgConfig;
};

var _runSpriteGenerator = function (generatorConfig) {

  console.log(generatorConfig)

  nsg(generatorConfig, function (err) {
    if (err) {
      logger.error("Error generating sprite for config [[ " + generatorConfig + " ]]");
    } else {
      logger.success("Sprite generated [[ " + generatorConfig.spritePath + " ]]");
    }
  });
};

var _getAllSpriteConfigs = function ( mimosaConfig ) {
  var configs = wrench.readdirSyncRecursive( mimosaConfig.sprite.imageDirFull ).map( function( shortPath ) {
    // build full path
    return path.join(mimosaConfig.sprite.imageDirFull, shortPath);
  }).filter( function filterDir( fullpath ) {
    // only care about directories
    return fs.statSync(fullpath).isDirectory();
  }).filter( function filterRootDir( fullpath ) {
    // only care about root directories
    return (path.dirname(fullpath) === mimosaConfig.sprite.imageDirFull);
  }).filter( function filterCommon( fullpath ) {
    // no common directory
    return (fullpath !== mimosaConfig.sprite.commonDirFull);
  }).filter( function filterNoFiles( fullpath ) {
    // remove any folders that have no files in them
    var folderFiles = wrench.readdirSyncRecursive( fullpath ).map( function( shortPath ) {
      return path.join(fullpath, shortPath);
    });

    for (var i in folderFiles) {
      if (fs.statSync(folderFiles[i]).isFile()) {
        return true;
      }
    }

    logger.warn("Sprite folder is empty [[ " + fullpath + " ]]");

    return false;
  }).map( function createSpriteConfigForFolder( fullpath ) {
    return _buildSpriteConfig(mimosaConfig, fullpath);
  });

  return configs;
};

var _generateSprites = function ( mimosaConfig, next ) {

  if ( !fs.existsSync( mimosaConfig.sprite.imageDirFull ) ) {
    logger.error("Could not find sprite.imageDir directory at [[ " + mimosaConfig.sprite.imageDirFull + " ]]");
    if (next) {
      next();
    }
    return;
  }

  var configs = _getAllSpriteConfigs( mimosaConfig )

  if (configs.length > 0) {
    _makeDirectory(mimosaConfig.sprite.stylesheetDirFull);
  }

  _runSpriteGenerator(configs[0]);

  if (next) {
    next();
  }
};

var registerCommand = function ( program, retrieveConfig ) {
  program
    .command( 'sprite' )
    .description( "Generate image sprites for your Mimosa application" )
    .action( function(){
      retrieveConfig( false, function( mimosaConfig ) {
        _generateSprites( mimosaConfig );
      });
    });
};

module.exports = {
  //registration:    registration,
  registerCommand: registerCommand,
  defaults:        config.defaults,
  placeholder:     config.placeholder,
  validate:        config.validate
};