// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include <string.h>
#include <stdlib.h>

#include "node/src/env-inl.h"
#include "node/src/node_errors.h"
#include "src/node_integration.h"

using node::errors::TryCatchScope;

namespace yode {

// Generated from js files.
v8::Local<v8::String> MainSource(node::Environment* env);
void DefineJavaScript(node::Environment* env, v8::Local<v8::Object> target);

namespace {

// The global instance of NodeIntegration.
std::unique_ptr<NodeIntegration> g_node_integration;

// Untility function to create a V8 string.
inline v8::Local<v8::String> ToV8(node::Environment* env, const char* str) {
  return v8::String::NewFromUtf8(
      env->isolate(), str, v8::NewStringType::kNormal).ToLocalChecked();
}

// Force running uv loop.
void ActivateUvLoop(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (g_node_integration)
    g_node_integration->CallNextTick();
}

// Invoke our bootstrap script.
void Bootstrap(node::Environment* env,
               v8::Local<v8::Value> process,
               v8::Local<v8::Value> require) {
  // Set native methods.
  node::SetMethod(
      env->context(), env->process_object(), "activateUvLoop", &ActivateUvLoop);
  // Set process.versions.yode.
  v8::Local<v8::Value> versions = env->process_object()->Get(
      env->context(), ToV8(env, "versions")).ToLocalChecked();
  versions.As<v8::Object>()->Set(
      env->context(), ToV8(env, "yode"), ToV8(env, "0.11.1")).ToChecked();
  // Initialize GUI after Node gets initialized.
  Init(env);
  // Put our scripts into |exports|.
  v8::Local<v8::Object> exports = v8::Object::New(env->isolate());
  DefineJavaScript(env, exports);
  // Get the |bootstrap| function.
  v8::ScriptOrigin origin(
      env->isolate(),
      node::FIXED_ONE_BYTE_STRING(env->isolate(), "bootstrap.js"));
  v8::MaybeLocal<v8::Script> script =
      v8::Script::Compile(env->context(), MainSource(env), &origin);
  v8::MaybeLocal<v8::Value> result =
      script.ToLocalChecked()->Run(env->context());
  v8::Local<v8::Function> bootstrap =
      v8::Local<v8::Function>::Cast(result.ToLocalChecked());
  // Invoke the |bootstrap| with |exports|.
  std::vector<v8::Local<v8::Value>> args = { process, require, exports };
  TryCatchScope try_catch(env, TryCatchScope::CatchMode::kFatal);
  v8::MaybeLocal<v8::Value> ret = bootstrap->Call(env->context(),
                                                  env->context()->Global(),
                                                  args.size(),
                                                  args.data());
  // Change process.argv if the binary starts itself.
  v8::Local<v8::Value> r;
  if (ret.ToLocal(&r) && r->IsString()) {
    auto& argv = const_cast<std::vector<std::string>&>(env->argv());
    argv.insert(++argv.begin(), *v8::String::Utf8Value(env->isolate(), r));
  }
}

// Like SpinEventLoop but replaces the uv_run with RunLoop.
int SpinGUIEventLoop(node::Environment* env) {
  env->set_trace_sync_io(env->options()->trace_sync_io);

  // Run GUI message loop.
  RunLoop(env);
  // No need to keep uv loop alive.
  g_node_integration->ReleaseHandleRef();
  // Enter uv loop to handle unfinished uv tasks.
  uv_run(env->event_loop(), UV_RUN_DEFAULT);

  node::EmitProcessBeforeExit(env);
  env->set_trace_sync_io(false);
  env->ForEachRealm([](auto* realm) { realm->VerifyNoStrongBaseObjects(); });
  auto exit_code = node::EmitProcessExitInternal(env);
  return static_cast<int>(
      exit_code.FromMaybe(node::ExitCode::kGenericUserError));
}

}  // namespace

int Start(int argc, char* argv[]) {
  // Always enable GC this app is almost always running on desktop.
  v8::V8::SetFlagsFromString("--expose_gc", 11);

  // Set up per-process state.
  std::vector<std::string> args(argv, argv + argc);
  auto init = node::InitializeOncePerProcess(args);

  // Initialize V8.
  auto* platform = init->platform();
  std::unique_ptr<node::ArrayBufferAllocator> array_buffer_allocator(
      node::ArrayBufferAllocator::Create());
  auto isolate_params = std::make_unique<v8::Isolate::CreateParams>();
  isolate_params->array_buffer_allocator = array_buffer_allocator.get();
  v8::Isolate* isolate = node::NewIsolate(isolate_params.get(),
                                          uv_default_loop(),
                                          platform);
  std::unique_ptr<node::IsolateData> isolate_data(node::CreateIsolateData(
      isolate,
      uv_default_loop(),
      platform,
      array_buffer_allocator.get(),
      nullptr));
  isolate_data->max_young_gen_size =
      isolate_params->constraints.max_young_generation_size_in_bytes();

  int exit_code = 0;
  {
    // Create environment.
    v8::Locker locker(isolate);
    v8::Isolate::Scope isolate_scope(isolate);
    v8::HandleScope handle_scope(isolate);
    v8::Local<v8::Context> context = node::NewContext(isolate);
    v8::Context::Scope context_scope(context);
    node::DeleteFnPtr<node::Environment, node::FreeEnvironment> env(
        node::CreateEnvironment(isolate_data.get(),
                                context,
                                init->args(),
                                init->exec_args()));

    // Check if this process should run GUI event loop.
    const char* run_as_node = getenv("YODE_RUN_AS_NODE");
    if (!run_as_node || strcmp(run_as_node, "1")) {
      g_node_integration.reset(NodeIntegration::Create());
      g_node_integration->Init();
    }

    // Load bootstrap script.
    if (g_node_integration)
      env->set_embedder_preload(&Bootstrap);

    // Load node.
    {
      node::LoadEnvironment(env.get(), node::StartExecutionCallback{});
      // Enter event loop.
      if (g_node_integration) {
        g_node_integration->UvRunOnce();
        exit_code = SpinGUIEventLoop(env.get());
      } else {
        exit_code = node::SpinEventLoop(env.get()).FromMaybe(1);
      }
    }
    node::Stop(env.get());
  }
  isolate_data.reset();
  platform->UnregisterIsolate(isolate);
  isolate->Dispose();
  node::TearDownOncePerProcess();
  return exit_code;
}

}  // namespace yode
