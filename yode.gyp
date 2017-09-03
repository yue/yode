{
  'targets': [
    {
      'target_name': 'yode',
      'type': 'executable',
      'sources': [
        'src/main.cc',
        'src/node_integration.cc',
        'src/node_integration.h',
        'src/node_integration_linux.cc',
        'src/node_integration_linux.h',
        'src/node_integration_mac.h',
        'src/node_integration_mac.mm',
        'src/node_integration_win.cc',
        'src/node_integration_win.h',
        'src/yode.cc',
        'src/yode.h',
        'src/yode_linux.cc',
        'src/yode_mac.mm',
      ],
      'include_dirs': [
        '.',
        'node/deps/cares/include',  # for ares.h
        'node/deps/uv/include',  # for uv.h
      ],
      'defines': [
        'NODE_WANT_INTERNALS=1',
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
          'link_settings': {
            'libraries': [
              '$(SDKROOT)/System/Library/Frameworks/AppKit.framework',
            ],
          },
          'xcode_settings': {
            # Generates symbols and strip the binary.
            'DEBUG_INFORMATION_FORMAT': 'dwarf-with-dsym',
            'DEPLOYMENT_POSTPROCESSING': 'YES',
            'STRIP_INSTALLED_PRODUCT': 'YES',
            'STRIPFLAGS': '-x',
            # Force loading all objects of node, otherwise some built-in modules
            # won't load.
            'OTHER_LDFLAGS': [
              '-Wl,-force_load,<(PRODUCT_DIR)/libnode.a',
            ],
          },
        }],
        ['OS=="win"', {
          'sources': [
            'src/yode.rc',
            'deps/node.def',
          ],
          'msvs_settings': {
            'VCManifestTool': {
              # Manifest file.
              'EmbedManifest': 'true',
              'AdditionalManifestFiles': 'src/yode.exe.manifest'
            },
            'VCLinkerTool': {
              # Using 5.01 would make Windows turn on compatibility mode for
              # certain win32 APIs, which would return wrong results.
              'MinimumRequiredVersion': '5.02',
              # A win32 GUI program.
              'SubSystem': '2',
            },
          },
        }],
        ['OS in "linux freebsd"', {
          'libraries': [
            '<!@(pkg-config gtk+-3.0 --libs)',
          ],
          'include_dirs': [
            '<!@(pkg-config gtk+-3.0 --cflags-only-I | sed s/-I//g)',
          ],
          # Force loading all objects of node, otherwise some built-in modules
          # won't load.
          'ldflags': [
            '-Wl,--whole-archive,<(OBJ_DIR)/node/libnode.a',
            '-Wl,--no-whole-archive',
          ],
        }],
      ],
    },
  ],
}
