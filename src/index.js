var fs = require('fs'),
    path = require('path'),

    nsg = require('node-sprite-generator'),
    _ = require('lodash'),
    async = require('async'),
    logger = require('logmimosa'),
    wrench = require('wrench'),

    config = require('./config');

var _makeDirectory = function ( dir ) {
  if (!fs.existsSync(dir)) {
    logger.debug("Making folder [[ " + dir + " ]]");
    wrench.mkdirSyncRecursive(dir, 0777);
  }
};

var _buildSpriteConfig = function ( mimosaConfig, folderPath ) {
  // file name is folder name plus .png
  var folderName = path.basename( folderPath );
  var spriteFileName = folderName + ".png";

  // out file for sprite images
  var spriteOutFile = path.join( mimosaConfig.sprite.outDirFull, spriteFileName );

  // out file stylesheets
  var stylesheetOutFile = path.join( mimosaConfig.sprite.stylesheetOutDirFull, folderName );

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

  // perform overrides
  if ( typeof mimosaConfig.sprite.options === 'function') {
    nsgConfig = mimosaConfig.sprite.options(nsgConfig);
  } else {
    nsgConfig = _.extend(nsgConfig, mimosaConfig.sprite.options);
  }

  _makeDirectory( path.dirname( spriteOutFile ) );

  return nsgConfig;
};

var _runSpriteGenerator = function ( generatorConfig, cb ) {
  nsg( generatorConfig, function ( err ) {
    if ( err ) {
      logger.error( "Error generating sprite for config [[ " + generatorConfig + " ]]" );
    } else {
      logger.success( "Sprite generated [[ " + generatorConfig.spritePath + " ]]" );
    }
    cb();
  });
};

var _getAllSpriteConfigs = function ( mimosaConfig ) {
  var configs = wrench.readdirSyncRecursive( mimosaConfig.sprite.inDirFull ).map( function( shortPath ) {
    // build full path
    return path.join(mimosaConfig.sprite.inDirFull, shortPath);
  }).filter( function filterDir( fullpath ) {
    // only care about directories
    return fs.statSync(fullpath).isDirectory();
  }).filter( function filterRootDir( fullpath ) {
    // only care about root directories
    return (path.dirname(fullpath) === mimosaConfig.sprite.inDirFull);
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

  if ( !fs.existsSync( mimosaConfig.sprite.inDirFull ) ) {
    logger.error("Could not find sprite.inDir directory at [[ " + mimosaConfig.sprite.inDirFull + " ]]");
    if (next) {
      next();
    }
    return;
  }

  var configs = _getAllSpriteConfigs( mimosaConfig );

  if (configs.length > 0) {
    _makeDirectory( mimosaConfig.sprite.stylesheetOutDirFull );
  }

  async.eachSeries(configs, function(config, cb) {
    _runSpriteGenerator(config, cb);
  });

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
  registerCommand: registerCommand,
  defaults:        config.defaults,
  placeholder:     config.placeholder,
  validate:        config.validate
};