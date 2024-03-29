{
  'includes': [
    'node/common.gypi',
  ],
  'variables': {
    # Reflects node's config.gypi.
    'library%': 'static_library',
    'component': 'static_library',
    'coverage': 'false',
    'llvm_version': '3.3',
    'debug_nghttp2': 'false',
    'debug_node': 'false',
    'enable_lto': 'false',
    'enable_pgo_generate': 'false',
    'enable_pgo_use': 'false',
    'force_dynamic_crt': 0,
    'openssl_fips': '',
    'openssl_is_fips': 'false',
    'openssl_no_asm': 1,
    'openssl_quic': 'true',
    'OPENSSL_PRODUCT': 'libopenssl.a',
    'node_release_urlbase': '',
    'node_byteorder': '<!(node -e "console.log(require(\'os\').endianness() === \'BE\' ? \'big\' : \'little\')")',
    'node_target_type': 'static_library',
    'node_lib_target_name': 'libnode',
    'node_fipsinstall': 'false',
    'node_install_npm': 'false',
    'node_prefix': '',
    'node_shared': 'false',
    'node_shared_brotli': 'false',
    'node_shared_cares': 'false',
    'node_shared_http_parser': 'false',
    'node_shared_libuv': 'false',
    'node_shared_nghttp2': 'false',
    'node_shared_nghttp3': 'false',
    'node_shared_ngtcp2': 'false',
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
    'node_use_large_pages': 'false',
    'node_debug_lib': 'false',
    'node_with_ltcg': 'false',
    'node_report': 'false',
    'node_use_node_code_cache': 'false',
    'uv_library': 'static_library',
    'uv_parent_path': 'node/deps/uv',
    'uv_use_dtrace': 'false',
    'V8_BASE': '',
    'v8_enable_31bit_smis_on_64bit_arch': 0,
    'v8_enable_gdbjit': 0,
    'v8_enable_hugepage': 0,
    'v8_enable_i18n_support': 1,
    'v8_enable_inspector': 1,
    'v8_enable_javascript_promise_hooks': 1,
    'v8_enable_lite_mode': 0,
    'v8_enable_object_print': 1,
    'v8_enable_pointer_compression': 0,
    'v8_enable_shared_ro_heap': 1,
    'v8_enable_short_builtin_calls': 1,
    'v8_enable_webassembly': 1,
    'v8_no_strict_aliasing': 1,
    'v8_optimized_debug': 0,
    'v8_promise_internal_field_count': 1,
    'v8_random_seed': 0,
    'v8_trace_maps': 0,
    'v8_use_siphash': 1,
    'icu_data_file': 'icudt73l.dat',
    'icu_data_in': '../../deps/icu-tmp/icudt73l.dat',
    'icu_default_data': '',
    'icu_endianness': 'l',
    'icu_gyp_path': 'node/tools/icu/icu-generic.gyp',
    'icu_locales': 'en,root',
    'icu_path': '../../deps/icu-small',
    'icu_small': 'true',
    'icu_ver_major': '73',
  },
  'target_defaults': {
    'includes': [
      'deps/filename_rules.gypi',
    ],
    'include_dirs': [
      'node/deps/v8/include',
    ],
    'target_conditions': [
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
