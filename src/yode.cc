// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include <string.h>
#include <stdlib.h>

#include "node/src/env-inl.h"
#include "src/node_integration.h"

namespace yode {

// Generated from js files.
v8::Local<v8::String> MainSource(node::Environment* env);
void DefineJavaScript(node::Environment* env, v8::Local<v8::Object> target);

namespace {

// The global instance of NodeIntegration.
std::unique_ptr<NodeIntegration> g_node_integration;

// Has we run message loop before.
bool g_first_runloop = true;

// Untility function to create a V8 string.
inline v8::Local<v8::String> ToV8(node::Environment* env, const char* str) {
  return v8::String::NewFromUtf8(
      env->isolate(), str, v8::String::kNormalString);
}

// The fallback console logging.
void Log(const v8::FunctionCallbackInfo<v8::Value>& args) {
  for (int32_t i = 0; i < args.Length(); ++i) {
    fprintf(stdout, "%s", *v8::String::Utf8Value(args[i]));
  }
}

// Invoke our bootstrap script.
void Bootstrap(const v8::FunctionCallbackInfo<v8::Value>& args) {
  node::Environment* env = node::Environment::GetCurrent(args);
  // Put our scripts into |exports|.
  v8::Local<v8::Object> exports = v8::Object::New(env->isolate());
  DefineJavaScript(env, exports);
  // Get the |bootstrap| function.
  v8::ScriptOrigin origin(
      FIXED_ONE_BYTE_STRING(env->isolate(), "bootstrap.js"));
  v8::MaybeLocal<v8::Script> script =
      v8::Script::Compile(env->context(), MainSource(env), &origin);
  v8::MaybeLocal<v8::Value> result =
      script.ToLocalChecked()->Run(env->context());
  v8::Local<v8::Function> bootstrap =
      v8::Local<v8::Function>::Cast(result.ToLocalChecked());
  // Invoke the |bootstrap| with |exports|.
  bootstrap->Call(env->context(), exports, 0, nullptr).IsEmpty();
}

// Inject yode's version to process.versions.
bool InitWrapper(node::Environment* env) {
  // Initialize GUI after Node gets initialized.
  v8::HandleScope handle_scope(env->isolate());
  Init(env);
  // process.log = Log
  env->SetMethod(env->process_object(), "log", &Log);
  // process.bootstrap = Bootstrap
  env->SetMethod(env->process_object(), "bootstrap", &Bootstrap);
  // versions = process.versions
  v8::Local<v8::Value> versions = env->process_object()->Get(
      env->context(), ToV8(env, "versions")).ToLocalChecked();
  // versions.yode = 0.3.0
  versions.As<v8::Object>()->Set(
      env->context(), ToV8(env, "yode"), ToV8(env, "0.3.0")).ToChecked();
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
  const char* run_as_node = getenv("YODE_RUN_AS_NODE");
  if (!run_as_node || strcmp(run_as_node, "1")) {
    // Prepare node integration.
    g_node_integration.reset(NodeIntegration::Create());
    g_node_integration->Init();

    // Make Node use our message loop.
    node::SetRunLoop(&InitWrapper, &RunLoopWrapper);
  }

  // Start node and enter message loop.
  int code = node::Start(argc, argv);

  // Clean up node integration and quit.
  g_node_integration.reset();
  return code;
}

}  // namespace yode
