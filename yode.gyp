{
  'targets': [
    {
      'target_name': 'yode',
      'type': 'executable',
      'sources': [
        'src/main.cc'
      ],
      'dependencies': [
        'node/node.gyp:node',
      ],
    },
  ],
}
