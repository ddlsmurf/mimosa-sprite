mimosa-spritesmith
===========
## Overview

Modified version of [mimosa-sprite](https://github.com/dbashford/mimosa-sprite):

- Use [spritesmith](https://github.com/Ensighten/spritesmith)

  Smarter packing algorithm available.

- Use [json2css](https://github.com/twolfson/json2css)

  Easily customisable templates.

Heavily inspired by [grunt-spritesmith](https://github.com/Ensighten/grunt-spritesmith).

For more information regarding Mimosa, see http://mimosa.io.

## Usage

Add `'spritesmith'` to your list of modules.  That's all!  Mimosa will install the module for you when you start up.

This module depends on [spritesmith](https://github.com/Ensighten/spritesmith) which in turn has its own system dependencies.

Once this module has been added to your project, just execute `mimosa spritesmith` to generate your sprites.  This module comes with some default config (see below) and if your project matches that config, you won't have any other work to do.

## Functionality

This module will generate sprite images and Stylus/CSS artifacts for those sprites.

Sprites will be generated for each folder in the `sprite.inDir`. So, if `sprite.inDir` points to `images/sprite` (the default), and inside `images/sprite` there are 3 folders named `foo`, `bar` and `baz`, then 3 sprite `.png`s will be created called `foo.png`, `bar.png` and `baz.png`. Those images will be placed in the `sprite.outDir`, which is by default `images`.

For each sprite created, this module will place a stylesheet asset (either Stylus or CSS depending on config, Stylus by default), in the `sprite.stylesheetOutDir`.

If you are building many sprites, and those sprites have a set of images in common, you can place the common images in the `sprite.commonDir`, by default `images/sprite/common`.  This special folder will not create a sprite of its own, but any images inside this folder will be included in all sprites.

## Default Config

```
spritesmith:
  inDir: "images/sprite"
  outDir: "images"
  commonDir: "common"
  stylesheetOutDir: "stylesheets/sprite"
  options:
    engine: 'gm'
    algorithm: 'binary-tree'
    json2css:
      renamer: (imageName, spriteName) -> spriteName + '_' + imageName
```

* `inDir`: a string. The folder inside which are the images to be sprited. Every folder at the root of this folder will generate a single sprite. This path is relative to `watch.sourceDir`, which defaults to `assets`
* `outDir`: Where to place generated sprites relative to `watch.sourceDir` Placing the output images outside the sprite directory makes it easy to exclude the sprite directory from being copied to `watch.compiledDir`.
* `commonDir`: Folder inside which are images to be included in every sprite. This is a string path relative to `inDir`.
* `stylesheetOutDir`: Where to place the output stylesheets. Path is relative to `watch.sourceDir`
* `options`, an object or function. Pass-through options for [spritesmith](https://github.com/Ensighten/spritesmith), the tool this module uses under the hood to do the heavy lifting.
  * `json2css`, and object. Pass-through options for [json2css](https://github.com/twolfson/json2css).

## Example Config

If using stylus 0.39.1, you can handle retina sprites by generating a hash
variable. Create one sprite called `sprites` and another called `sprites@2x`.

```
spritesmith:
  inDir: '../sprites'
  stylesheetOutDir: 'stylesheets'
  options:
    engine: 'gm'
    algorithm: 'binary-tree'
    json2css:
      format: 'stylus_hashtable'
      renamer: (name, spriteName) -> name
      templates:
        'stylus_hashtable': """
${{options.spriteName}} = {
  image: '{{{items.0.escaped_image}}}',
  width: {{items.0.px.total_width}},
  height: {{items.0.px.total_height}},
  {{#items}}
  {{name}}: {{px.offset_x}} {{px.offset_y}} {{px.width}} {{px.height}},
  {{/items}}
  names: {{#items}}'{{name}}' {{/items}}
}
        """
```

You can then include the file and generate styles for icons in your stylus file, for example:

```

@import 'sprites'
@import 'sprites@2x'

sprite-size(name)
  width $sprites[name][2]
  height $sprites[name][3]
sprite-offset(name)
  background-position $sprites[name][0] $sprites[name][1]
for spriteName in $sprites.names
  .icon.{spriteName},
  .icon-{spriteName}-sized
    sprite-size(spriteName)
  .icon.{spriteName}
    sprite-offset(spriteName)
icon-background(selector)
  {selector}
    background-image url($sprites['image'])
  @media (-webkit-min-device-pixel-ratio: 1.5),
    (min--moz-device-pixel-ratio: 1.5),
    (-o-min-device-pixel-ratio: 3/2),
    (min-device-pixel-ratio: 3/2)
    {selector}
      background-image url($sprites_2x['image'])
      background-size $sprites['width'] $sprites['height']
icon-background('.icon')

```



