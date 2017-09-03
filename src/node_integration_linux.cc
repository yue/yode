// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/node_integration_linux.h"

#include <gtk/gtk.h>
#include <sys/epoll.h>

namespace yode {

namespace {

// A helper to call destructor for a type.
template<typename T>
void Delete(void* ptr) {
  delete static_cast<T*>(ptr);
}

// Called to executed the task.
gboolean OnSource(std::function<void()>* func) {
  (*func)();
  return G_SOURCE_REMOVE;
}

}  // namespace

NodeIntegrationLinux::NodeIntegrationLinux() : epoll_(epoll_create(1)) {
  // Listen to the backend fd.
  int backend_fd = uv_backend_fd(uv_loop_);
  struct epoll_event ev = { 0, 0 };
  ev.events = EPOLLIN;
  ev.data.fd = backend_fd;
  epoll_ctl(epoll_, EPOLL_CTL_ADD, backend_fd, &ev);

  // Get notified when libuv's watcher queue changes.
  uv_loop_->data = this;
  uv_loop_->on_watcher_queue_updated = OnWatcherQueueChanged;
}

NodeIntegrationLinux::~NodeIntegrationLinux() {
}

void NodeIntegrationLinux::PollEvents() {
  int timeout = uv_backend_timeout(uv_loop_);

  // Wait for new libuv events.
  int r;
  do {
    struct epoll_event ev;
    r = epoll_wait(epoll_, &ev, 1, timeout);
  } while (r == -1 && errno == EINTR);
}

void NodeIntegrationLinux::PostTask(const std::function<void()>& task) {
  g_idle_add_full(G_PRIORITY_DEFAULT,
                  reinterpret_cast<GSourceFunc>(OnSource),
                  new std::function<void()>(task),
                  Delete<std::function<void()>>);
}

// static
void NodeIntegrationLinux::OnWatcherQueueChanged(uv_loop_t* loop) {
  // We need to break the io polling in the epoll thread when loop's watcher
  // queue changes, otherwise new events cannot be notified.
  auto* self = static_cast<NodeIntegrationLinux*>(loop->data);
  self->WakeupEmbedThread();
}

// static
NodeIntegration* NodeIntegration::Create() {
  return new NodeIntegrationLinux();
}

}  // namespace yode
