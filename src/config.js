"use strict";

var path = require( "path" ),
    fs = require( "fs" );

exports.defaults = function() {
  return {
    spritesmith: {
      inDir: "images/sprite",
      outDir: "images",
      commonDir: "common",
      stylesheetOutDir: "stylesheets/sprite",
      isCSS: false,
      isStylus: true,
      options: {
        json2css: {
          formatOpts: {}
        }
      }
    }
  };
};

exports.validate = function ( config, validators ) {
  var errors = [];
  if ( validators.ifExistsIsObject( errors, "spritesmith config", config.spritesmith ) ) {
    if ( validators.ifExistsIsString( errors, "spritesmith.inDir", config.spritesmith.inDir ) ) {
      config.spritesmith.inDirFull = path.join( config.watch.sourceDir, config.spritesmith.inDir );

      if ( validators.ifExistsIsString( errors, "spritesmith.commonDir", config.spritesmith.commonDir ) ) {
        config.spritesmith.commonDirFull = path.join( config.spritesmith.inDirFull, config.spritesmith.commonDir );

        // If it doesnt exist, nuke it
        if ( !fs.existsSync( config.spritesmith.commonDirFull ) ) {
          config.spritesmith.commonDirFull = null;
        }
      }
    }

    if ( validators.ifExistsIsString( errors, "spritesmith.outDir", config.spritesmith.outDir ) ) {
      config.spritesmith.outDirFull = path.join( config.watch.sourceDir, config.spritesmith.outDir );
    }

    if ( validators.ifExistsIsString( errors, "spritesmith.stylesheetOutDir", config.spritesmith.stylesheetOutDir ) ) {
      config.spritesmith.stylesheetOutDirFull = path.join( config.watch.sourceDir, config.spritesmith.stylesheetOutDir );
    }

    var o = config.spritesmith.options;
    if ( ( typeof o === "object" && !Array.isArray( o ) ) || ( typeof o === "function" )) {
      if ( o.stylesheet && o.stylesheet === "css" ) {
        config.spritesmith.isCSS = true;
        config.spritesmith.isStylus = false;
      }
    } else {
      errors.push( "spritesmith.options must be an object or a function" );
    }

  }

  return errors;
};
