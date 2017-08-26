{
  'includes': [
    'node/common.gypi',
  ],
  'variables': {
    # Reflects node's config.gypi.
    'component%': 'static_library',
    'library%': 'static_library',
    'python': 'python',
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
    'node_shared_v8': 'true',
    'node_shared_zlib': 'false',
    'node_tag': '',
    'node_use_dtrace': 'false',
    'node_use_etw': 'false',
    'node_use_mdb': 'false',
    'node_use_openssl': 'true',
    'node_use_perfctr': 'false',
    'node_use_v8_platform': 'false',
    'node_use_bundled_v8': 'false',
    'node_enable_d8': 'false',
    'uv_library': 'static_library',
    'uv_parent_path': 'node/deps/uv',
    'uv_use_dtrace': 'false',
    'V8_BASE': '',
    'v8_postmortem_support': 'false',
    'v8_enable_i18n_support': 'false',
    'v8_enable_inspector': '1',
  },
  'target_defaults': {
    'include_dirs': [
      'node/deps/v8/include',
    ],
    'msvs_disabled_warnings': [
      4003,  # not enough actual parameters for macro 'V'
      4013,  # 'free' undefined; assuming extern returning int
      4018,  # signed/unsigned mismatch
      4054,  #
      4055,  # 'type cast' : from data pointer 'void *' to function pointer
      4057,  # 'function' : 'volatile LONG *' differs in indirection to slightly different base types from 'unsigned long *'
      4065,  # switch statement contains 'default' but no 'case' labels
      4189,  #
      4131,  # uses old-style declarator
      4133,  # incompatible types
      4146,  # unary minus operator applied to unsigned type, result still unsigned
      4164,  # intrinsic function not declared
      4152,  # function/data pointer conversion in expression
      4206,  # translation unit is empty
      4204,  # non-constant aggregate initializer
      4210,  # nonstandard extension used : function given file scope
      4214,  # bit field types other than int
      4232,  # address of dllimport 'free' is not static, identity not guaranteed
      4291,  # no matching operator delete found
      4295,  # array is too small to include a terminating null character
      4311,  # 'type cast': pointer truncation from 'void *const ' to 'unsigned long'
      4389,  # '==' : signed/unsigned mismatch
      4456,  # declaration of 'm' hides previous local declaration
      4457,  # declaration of 'message' hides function parameter
      4459,  # declaration of 'wq' hides global declaration
      4477,  # format string '%.*s' requires an argument of type 'int'
      4505,  # unreferenced local function has been removed
      4701,  # potentially uninitialized local variable 'sizew' used
      4703,  # potentially uninitialized local pointer variable 'req' used
      4706,  # assignment within conditional expression
      4804,  # unsafe use of type 'bool' in operation
      4996,  # this function or variable may be unsafe.
    ],
    'xcode_settings': {
      'WARNING_CFLAGS': [
        '-Wno-unknown-warning-option',
        '-Wno-parentheses-equality',
        '-Wno-unused-function',
        '-Wno-sometimes-uninitialized',
        '-Wno-pointer-sign',
        '-Wno-sign-compare',
        '-Wno-string-plus-int',
        '-Wno-unused-variable',
        '-Wno-deprecated-declarations',
        '-Wno-return-type',
        '-Wno-gnu-folding-constant',
        '-Wno-shift-negative-value',
        '-Wno-missing-field-initializers',
        '-Wno-varargs', # https://git.io/v6Olj
      ],
      'WARNING_CFLAGS!': [
        '-W',
      ],
    },
    'conditions': [
      ['OS=="linux"', {
        'cflags': [
          '-Wno-parentheses-equality',
          '-Wno-unused-function',
          '-Wno-sometimes-uninitialized',
          '-Wno-pointer-sign',
          '-Wno-string-plus-int',
          '-Wno-unused-variable',
          '-Wno-unused-value',
          '-Wno-deprecated-declarations',
          '-Wno-return-type',
          '-Wno-shift-negative-value',
          '-Wno-format',
          '-Wno-varargs', # https://git.io/v6Olj
        ],
      }],
    ],
  },
}
