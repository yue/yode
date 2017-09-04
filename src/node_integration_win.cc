// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/node_integration_win.h"

namespace yode {

// static
CRITICAL_SECTION NodeIntegrationWin::lock_;

// static
std::unordered_map<UINT_PTR, std::function<void()>> NodeIntegrationWin::tasks_;

NodeIntegrationWin::NodeIntegrationWin() {
  InitializeCriticalSectionAndSpinCount(&lock_, 0x00000400);
}

NodeIntegrationWin::~NodeIntegrationWin() {
  DeleteCriticalSection(&lock_);
}

void NodeIntegrationWin::PollEvents() {
  // If there are other kinds of events pending, uv_backend_timeout will
  // instruct us not to wait.
  DWORD bytes, timeout;
  ULONG_PTR key;
  OVERLAPPED* overlapped;

  timeout = uv_backend_timeout(uv_loop_);

  GetQueuedCompletionStatus(uv_loop_->iocp,
                            &bytes,
                            &key,
                            &overlapped,
                            timeout);

  // Give the event back so libuv can deal with it.
  if (overlapped != NULL)
    PostQueuedCompletionStatus(uv_loop_->iocp,
                               bytes,
                               key,
                               overlapped);
}

void NodeIntegrationWin::PostTask(const std::function<void()>& task) {
  UINT_PTR event = ::SetTimer(NULL, NULL, USER_TIMER_MINIMUM, OnTimer);
  ::EnterCriticalSection(&lock_);
  tasks_[event] = task;
  ::LeaveCriticalSection(&lock_);
}

// static
void CALLBACK NodeIntegrationWin::OnTimer(HWND, UINT, UINT_PTR event, DWORD) {
  ::KillTimer(NULL, event);
  std::function<void()> task;
  {
    ::EnterCriticalSection(&lock_);
    task = tasks_[event];
    tasks_.erase(event);
    ::LeaveCriticalSection(&lock_);
  }
  task();
}

// static
NodeIntegration* NodeIntegration::Create() {
  return new NodeIntegrationWin();
}

}  // namespace yode
