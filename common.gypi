{
  'includes': [
    'node/common.gypi',
  ],
  'variables': {
    'component': 'static_library',
    'icu_gyp_path': 'node/tools/icu/icu-generic.gyp',
  },
  'target_defaults': {
    'includes': [
      'deps/filename_rules.gypi',
    ],
    'include_dirs': [
      'node/deps/v8/include',
    ],
    'target_conditions': [
      ['_target_name=="libnode"', {
        'defines': [
          'DISABLE_SINGLE_EXECUTABLE_APPLICATION',
        ],
      }],
      ['_target_name=="libnode" and OS=="win"', {
        # Force loading all objects of node, otherwise some built-in modules
        # won't load.
        'sources': [
          'deps/node.def',
        ],
        'defines': [
          # We want to export Node's symbols but do not wish to change its
          # vc runtime settings.
          'NODE_SHARED_MODE',
          # ICU is built as static library and this has to be defined for its
          # users on Windows.
          'U_STATIC_IMPLEMENTATION=1',
        ],
      }],
      ['_target_name in ["v8_base_without_compiler", "v8_initializers"] and OS=="win"', {
        # Required for avoiding LINK error:
        # fatal error LNK1248: image size exceeds maximum allowable size
        'msvs_shard': 4,
      }],
      ['_target_name in ["genrb", "genccode"] or _target_name.startswith("libnode") or _target_name.startswith("icu")', {
        # Somehow Node's gyp files are not adding the include dirs.
        'include_dirs': [
          'node/deps/icu-small/source/common',
          'node/deps/icu-small/source/i18n',
          'node/deps/icu-small/source/tools/toolutil',
        ],
      }],
      ['_target_name in ["libuv", "http_parser", "openssl", "openssl-cli", "cares", "libnode", "nghttp2", "zlib", "mksnapshot", "genrb", "genccode", "simdutf"] or _target_name.startswith("v8") or _target_name.startswith("icu") or _target_name.startswith("node") or _target_name.startswith("torque")', {
        # Suppress all the warnings in Node.
        'msvs_settings': {
          'VCCLCompilerTool': {
            'WarningLevel': 0,
          },
        },
        'msvs_disabled_warnings': [
          4003,
          4146,
          4244,
          4251,
          4996,
        ],
        'xcode_settings': {
          'WARNING_CFLAGS': [
            '-Wno-deprecated-declarations',
            '-Wno-undefined-var-template',
            '-Wno-switch',
            '-Wno-unused-function',
            '-Wno-sign-compare',
            '-Wno-implicit-function-declaration',
            '-Wno-inconsistent-missing-override',
            '-Wno-nullability-completeness',
          ],
          'WARNING_CFLAGS!': [
            '-W',
            '-Wall',
          ],
        },
        'cflags': [
          '-Wno-deprecated-declarations',
          '-Wno-switch',
          '-Wno-unused-function',
          '-Wno-sign-compare',
          '-Wno-unused-but-set-variable',
          '-Wno-maybe-uninitialized',
          '-Wno-inconsistent-missing-override',
        ],
        'cflags_c': [
          '-Wno-deprecated-non-prototype',
          '-Wno-implicit-function-declaration',
        ],
        'cflags!': [
          '-Wall',
          '-Wextra',
        ],
      }],
    ],
  },
}
