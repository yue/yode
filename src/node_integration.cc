// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/node_integration.h"

#include <string>
#include <vector>

#include "node/deps/uv/src/uv-common.h"
#include "node/src/node.h"

namespace yode {

NodeIntegration::NodeIntegration()
    : uv_loop_(uv_default_loop()),
      embed_closed_(false) {
}

NodeIntegration::~NodeIntegration() {
  // Quit the embed thread.
  embed_closed_ = true;
  uv_sem_post(&embed_sem_);
  WakeupEmbedThread();

  // Wait for everything to be done.
  uv_thread_join(&embed_thread_);

  // Clear uv.
  uv_sem_destroy(&embed_sem_);
  uv_close(reinterpret_cast<uv_handle_t*>(&wakeup_handle_), nullptr);
}

void NodeIntegration::Init() {
  // Handled used for waking up the uv loop in embed thread.
  uv_async_init(uv_loop_, &wakeup_handle_, nullptr);
  uv_unref(reinterpret_cast<uv_handle_t*>(&wakeup_handle_));

  // Start worker that will interrupt main loop when having uv events.
  uv_sem_init(&embed_sem_, 0);
  uv_unref(reinterpret_cast<uv_handle_t*>(&embed_sem_));
  uv_thread_create(&embed_thread_, EmbedThreadRunner, this);
}

void NodeIntegration::UvRunOnce() {
  // Deal with uv events.
  uv_run(uv_loop_, UV_RUN_NOWAIT);

  // Tell the worker thread to continue polling.
  uv_sem_post(&embed_sem_);
}

void NodeIntegration::WakeupMainThread() {
  PostTask([this] {
    this->UvRunOnce();
  });
}

void NodeIntegration::WakeupEmbedThread() {
  uv_async_send(&wakeup_handle_);
}

// static
void NodeIntegration::EmbedThreadRunner(void *arg) {
  NodeIntegration* self = static_cast<NodeIntegration*>(arg);

  while (true) {
    // Wait for the main loop to deal with events.
    uv_sem_wait(&self->embed_sem_);
    if (self->embed_closed_)
      break;

    // Wait for something to happen in uv loop.
    // Note that the PollEvents() is implemented by derived classes, so when
    // this class is being destructed the PollEvents() would not be available
    // anymore. Because of it we must make sure we only invoke PollEvents()
    // when this class is alive.
    self->PollEvents();
    if (self->embed_closed_)
      break;

    // Break the loop when uv has decided to quit.
    if (self->uv_loop_->stop_flag != 0 ||
        (!uv__has_active_handles(self->uv_loop_) &&
         !uv__has_active_reqs(self->uv_loop_)))
      break;

    // Deal with event in main thread.
    self->WakeupMainThread();
  }
}

}  // namespace yode
