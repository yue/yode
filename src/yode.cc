// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include "node/src/node.h"
#include "src/node_integration.h"

namespace yode {

namespace {

// The global instance of NodeIntegration.
std::unique_ptr<NodeIntegration> g_node_integration;

// Has we run message loop before.
bool g_first_runloop = true;

// Run uv loop for once before entering GUI message loop.
bool RunLoopWrapper(node::Environment* env) {
  if (g_first_runloop) {
    g_node_integration->UvRunOnce();
    g_first_runloop = false;
  }
  return RunLoop(env);
}

}  // namespace

int Start(int argc, char* argv[]) {
  // Initialize GUI.
  Init();

  // Prepare node integration.
  g_node_integration.reset(NodeIntegration::Create());
  g_node_integration->Init();

  // Make Node use our message loop.
  node::SetRunLoop(&RunLoopWrapper);

  // Start node and enter message loop.
  int code = node::Start(argc, argv);

  // Clean up node integration and quit.
  g_node_integration.reset();
  return code;
}

}  // namespace yode
