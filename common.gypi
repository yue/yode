{
  'includes': [
    'node/common.gypi',
  ],
  'variables': {
    # Reflects node's config.gypi.
    'component%': 'static_library',
    'library%': 'static_library',
    'python': 'python',
    'coverage': 'false',
    'llvm_version': '3.3',
    'arm_float_abi': 'default',
    'arm_fpu': 'vfp',
    'arm_thumb': 0,
    'arm_version': 'default',
    'debug_http2': 0,
    'debug_nghttp2': 0,
    'openssl_fips': '',
    'openssl_no_asm': 1,
    'use_openssl_def': 0,
    'OPENSSL_PRODUCT': 'libopenssl.a',
    'node_release_urlbase': '',
    'node_byteorder': '<!(node -e "console.log(require(\'os\').endianness() === \'BE\' ? \'big\' : \'little\')")',
    'node_target_type': 'static_library',
    'node_install_npm': 'false',
    'node_prefix': '',
    'node_shared': 'false',
    'node_shared_cares': 'false',
    'node_shared_http_parser': 'false',
    'node_shared_libuv': 'false',
    'node_shared_openssl': 'false',
    'node_shared_v8': 'false',
    'node_shared_zlib': 'false',
    'node_tag': '',
    'node_use_dtrace': 'false',
    'node_use_etw': 'false',
    'node_use_mdb': 'false',
    'node_use_openssl': 'true',
    'node_use_perfctr': 'false',
    'node_use_v8_platform': 'true',
    'node_use_bundled_v8': 'false',
    'node_enable_d8': 'false',
    'uv_library': 'static_library',
    'uv_parent_path': 'node/deps/uv',
    'uv_use_dtrace': 'false',
    'V8_BASE': '',
    'v8_enable_i18n_support': '1',
    'v8_enable_inspector': '1',
    'icu_data_file': 'icudt59l.dat',
    'icu_data_in': '../../deps/icu-small/source/data/in/icudt59l.dat',
    'icu_endianness': 'l',
    'icu_gyp_path': 'node/tools/icu/icu-generic.gyp',
    'icu_locales': 'en,root',
    'icu_path': '../../deps/icu-small',
    'icu_small': 'true',
    'icu_ver_major': '59',
  },
  'target_defaults': {
    'includes': [
      'deps/filename_rules.gypi',
    ],
    'include_dirs': [
      'node/deps/v8/include',
    ],
    'target_conditions': [
      ['_target_name=="node" and OS=="win"', {
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
      ['_target_name in ["node", "genrb", "genccode"] or _target_name.startswith("icu")', {
        # Somehow Node's gyp files are not adding the include dirs.
        'include_dirs': [
          'node/deps/icu-small/source/common',
          'node/deps/icu-small/source/i18n',
          'node/deps/icu-small/source/tools/toolutil',
        ],
      }],
      ['_target_name in ["libuv", "http_parser", "openssl", "openssl-cli", "cares", "node", "zlib", "mksnapshot", "genrb", "genccode"] or _target_name.startswith("v8") or _target_name.startswith("icu")', {
        # Suppress all the warnings in Node.
        'msvs_settings': {
          'VCCLCompilerTool': {
            'WarningLevel': 0,
          },
        },
        'msvs_disabled_warnings': [
          4251,
        ],
        'xcode_settings': {
          'WARNING_CFLAGS': [
            '-Wno-deprecated-declarations',
            '-Wno-undefined-var-template',
            '-Wno-switch',
            '-Wno-unused-function',
            '-Wno-sign-compare',
            '-Wno-implicit-function-declaration',
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
