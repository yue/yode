{
  'targets': [
    {
      'target_name': 'yode',
      'type': 'executable',
      'sources': [
        'node/src/node_snapshot_stub.cc',
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
        'src/yode_win.cc',
        '<(SHARED_INTERMEDIATE_DIR)/yode_javascript.cc',
      ],
      'include_dirs': [
        '.',
        'node/deps/cares/include',  # for ares.h
        'node/deps/openssl/openssl/include',  # for openssl/opensslv.h
        'node/deps/uv/include',  # for uv.h
        'node/src',  # for node things
      ],
      'defines': [
        'NODE_HAVE_I18N_SUPPORT=1',
        'NODE_WANT_INTERNALS=1',
        'NODE_SHARED_MODE',
        'HAVE_OPENSSL=1',
        'HAVE_INSPECTOR=1',
      ],
      'dependencies': [
        'yode_js2c#host',
        'node/node.gyp:libnode',
        'node/tools/v8_gypfiles/v8.gyp:v8',
        'node/tools/v8_gypfiles/v8.gyp:v8_libplatform',
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
          'libraries': [
            'dbghelp.lib',
            'winmm.lib',
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
              # Defined in node target, required for building x86.
              'ImageHasSafeExceptionHandlers': 'false',
              # Disable incremental linking, for smaller program.
              'LinkIncremental': 1,
            },
          },
          'msvs_disabled_warnings': [
            4003,
            4251,
            4244,
            4996,
          ],
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
            '-Wl,--whole-archive,<(obj_dir)/node/libnode.a',
            '-Wl,--no-whole-archive',
          ],
        }],
      ],
    },
    {
      'target_name': 'yode_js2c',
      'type': 'none',
      'toolsets': ['host'],
      'actions': [
        {
          'action_name': 'yode_js2c',
          'process_outputs_as_sources': 1,
          'inputs': [
            'deps/js2c.py',
            'src/asar_archive.js',
            'src/asar_monkey_patch.js',
            'src/bootstrap.js',
            'src/pickle.js',
          ],
          'outputs': [
            '<(SHARED_INTERMEDIATE_DIR)/yode_javascript.cc',
          ],
          'action': [
            '<(python)',
            'deps/js2c.py',
            '<@(_outputs)',
            '<@(_inputs)',
          ],
        },
      ],
    },
  ],
}
