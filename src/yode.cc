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
      env->isolate(), str, v8::NewStringType::kNormal).ToLocalChecked();
}

// Force running uv loop.
void ActivateUvLoop(const v8::FunctionCallbackInfo<v8::Value>& args) {
  g_node_integration->CallNextTick();
}

// Invoke our bootstrap script.
void Bootstrap(const v8::FunctionCallbackInfo<v8::Value>& args) {
  node::Environment* env = node::Environment::GetCurrent(args);
  CHECK(env);
  // Initialize GUI after Node gets initialized.
  v8::HandleScope handle_scope(env->isolate());
  Init(env);
  // Put our scripts into |exports|.
  v8::Local<v8::Object> exports = v8::Object::New(env->isolate());
  DefineJavaScript(env, exports);
  // Get the |bootstrap| function.
  v8::ScriptOrigin origin(
      node::FIXED_ONE_BYTE_STRING(env->isolate(), "bootstrap.js"));
  v8::MaybeLocal<v8::Script> script =
      v8::Script::Compile(env->context(), MainSource(env), &origin);
  v8::MaybeLocal<v8::Value> result =
      script.ToLocalChecked()->Run(env->context());
  v8::Local<v8::Function> bootstrap =
      v8::Local<v8::Function>::Cast(result.ToLocalChecked());
  // Invoke the |bootstrap| with |exports|.
  std::vector<v8::Local<v8::Value>> bootstrap_args(args.Length());
  for (int i = 0; i < args.Length(); ++i)
    bootstrap_args[i] = args[i];
  bootstrap_args.push_back(ToV8(env, env->exec_path().c_str()));
  v8::MaybeLocal<v8::Value> ret =
      bootstrap->Call(env->context(), exports,
                      bootstrap_args.size(), bootstrap_args.data());
  // Change process.argv if the binary starts itself.
  v8::Local<v8::Value> r;
  if (ret.ToLocal(&r) && r->IsString()) {
    auto& argv = const_cast<std::vector<std::string>&>(env->argv());
    argv.insert(++argv.begin(), *v8::String::Utf8Value(env->isolate(), r));
  }
}

// Inject custom bindings.
bool InitWrapper(node::Environment* env) {
  // Native methods.
  env->SetMethod(env->process_object(), "bootstrap", &Bootstrap);
  env->SetMethod(env->process_object(), "activateUvLoop", &ActivateUvLoop);
  // versions.yode = 0.6.2
  v8::Local<v8::Value> versions = env->process_object()->Get(
      env->context(), ToV8(env, "versions")).ToLocalChecked();
  versions.As<v8::Object>()->Set(
      env->context(), ToV8(env, "yode"), ToV8(env, "0.6.2")).ToChecked();
  env->process_object()->DefineOwnProperty(
      env->context(), ToV8(env, "versions"), versions, v8::ReadOnly).Check();
  return true;
}

bool RunLoopWrapper(node::Environment* env) {
  // Run uv loop for once before entering GUI message loop.
  if (g_first_runloop) {
    g_node_integration->UvRunOnce();
    g_first_runloop = false;
  }
  // Run GUI message loop.
  RunLoop(env);
  // No need to keep uv loop alive.
  g_node_integration->ReleaseHandleRef();
  // Enter uv loop to handle unfinished uv tasks.
  return uv_run(env->event_loop(), UV_RUN_DEFAULT);
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

  // Always enable GC this app is almost always running on desktop.
  v8::V8::SetFlagsFromString("--expose_gc", 11);

  // Start node and enter message loop.
  int code = node::Start(argc, argv);

  // Clean up node integration and quit.
  g_node_integration.reset();
  return code;
}

}  // namespace yode
