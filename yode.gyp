{
  'targets': [
    {
      'target_name': 'yode',
      'type': 'executable',
      'sources': [
        'src/main.cc'
      ],
      'include_dirs': [
        '.',
      ],
      'dependencies': [
        'node/node.gyp:node',
        'node/deps/v8/src/v8.gyp:v8',
        'node/deps/v8/src/v8.gyp:v8_libplatform',
        'node/tools/icu/icu-generic.gyp:icui18n',
        'node/tools/icu/icu-generic.gyp:icuuc',
      ],
      'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            'OTHER_LDFLAGS': [
              '-Wl,-force_load,<(PRODUCT_DIR)/libnode.a',
            ],
          },
        }],
        ['OS in "linux freebsd"', {
          'ldflags': [
            '-Wl,--whole-archive,<(OBJ_DIR)/node/libnode.a',
            '-Wl,--no-whole-archive',
          ],
        }],
      ],
    },
  ],
}
