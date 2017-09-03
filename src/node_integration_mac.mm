// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/node_integration_mac.h"

#import <Cocoa/Cocoa.h>

#include <errno.h>
#include <sys/select.h>
#include <sys/sysctl.h>
#include <sys/time.h>
#include <sys/types.h>

namespace yode {

NodeIntegrationMac::NodeIntegrationMac() {
  // Get notified when libuv's watcher queue changes.
  uv_loop_->data = this;
  uv_loop_->on_watcher_queue_updated = OnWatcherQueueChanged;
}

NodeIntegrationMac::~NodeIntegrationMac() {
}

void NodeIntegrationMac::PollEvents() {
  struct timeval tv;
  int timeout = uv_backend_timeout(uv_loop_);
  if (timeout != -1) {
    tv.tv_sec = timeout / 1000;
    tv.tv_usec = (timeout % 1000) * 1000;
  }

  fd_set readset;
  int fd = uv_backend_fd(uv_loop_);
  FD_ZERO(&readset);
  FD_SET(fd, &readset);

  // Wait for new libuv events.
  int r;
  do {
    r = select(fd + 1, &readset, nullptr, nullptr,
               timeout == -1 ? nullptr : &tv);
  } while (r == -1 && errno == EINTR);
}

void NodeIntegrationMac::PostTask(const std::function<void()>& task) {
  __block std::function<void()> callback = task;
  dispatch_async(dispatch_get_main_queue(), ^{
    callback();
  });
}

// static
void NodeIntegrationMac::OnWatcherQueueChanged(uv_loop_t* loop) {
  // We need to break the io polling in the kqueue thread when loop's watcher
  // queue changes, otherwise new events cannot be notified.
  auto* self = static_cast<NodeIntegrationMac*>(loop->data);
  self->WakeupEmbedThread();
}

// static
NodeIntegration* NodeIntegration::Create() {
  return new NodeIntegrationMac();
}

}  // namespace yode
