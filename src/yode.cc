// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include "node/src/env-inl.h"
#include "src/node_integration.h"

namespace yode {

namespace {

// The global instance of NodeIntegration.
std::unique_ptr<NodeIntegration> g_node_integration;

// Has we run message loop before.
bool g_first_runloop = true;

// Inject yode's version to process.versions.
bool InjectYode(node::Environment* env) {
  // versions = process.versions
  CHECK(!env->process_object().IsEmpty());
  v8::HandleScope handle_scope(env->isolate());
  v8::MaybeLocal<v8::Value> key =
      v8::String::NewFromUtf8(env->isolate(), "versions",
                              v8::String::kNormalString);
  v8::MaybeLocal<v8::Value> versions =
      env->process_object()->Get(env->context(), key.ToLocalChecked());
  CHECK(!versions.IsEmpty());
  // versions.yode = v0.1.0
  v8::MaybeLocal<v8::Value> yode =
      v8::String::NewFromUtf8(env->isolate(), "yode",
                              v8::String::kNormalString);
  v8::MaybeLocal<v8::Value> version =
      v8::String::NewFromUtf8(env->isolate(), "v0.1.0",
                              v8::String::kNormalString);
  versions.ToLocalChecked().As<v8::Object>()->Set(
      env->context(), yode.ToLocalChecked(), version.ToLocalChecked());
  return true;
}

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
  node::SetRunLoop(&InjectYode, &RunLoopWrapper);

  // Start node and enter message loop.
  int code = node::Start(argc, argv);

  // Clean up node integration and quit.
  g_node_integration.reset();
  return code;
}

}  // namespace yode
