// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/node_integration_win.h"

// http://blogs.msdn.com/oldnewthing/archive/2004/10/25/247180.aspx
extern "C" IMAGE_DOS_HEADER __ImageBase;

// Returns the HMODULE of the dll the macro was expanded in.
// Only use in cc files, not in h files.
#define CURRENT_MODULE() reinterpret_cast<HMODULE>(&__ImageBase)

namespace yode {

NodeIntegrationWin::NodeIntegrationWin() {
  // Create a message only window to capture timer events.
	WNDCLASSEXW wcex;
  wcex.cbSize        = sizeof(WNDCLASSEX);
  wcex.style         = NULL;
  wcex.lpfnWndProc   = WndProc;
  wcex.cbClsExtra    = 0;
  wcex.cbWndExtra    = 0;
  wcex.hInstance     = CURRENT_MODULE();
  wcex.hIcon         = NULL;
  wcex.hCursor       = NULL;
  wcex.hbrBackground = NULL;
  wcex.lpszMenuName  = NULL;
  wcex.lpszClassName = L"YodeMessageClass";
  wcex.hIconSm       = NULL;
  ::RegisterClassExW(&wcex);
  message_window_ = ::CreateWindowW(L"YodeMessageClass" , L"TimerWindow",
                                    0, 10, 10, 10, 10, HWND_MESSAGE, 0,
                                    CURRENT_MODULE(), this);

  InitializeCriticalSectionAndSpinCount(&lock_, 0x00000400);
}

NodeIntegrationWin::~NodeIntegrationWin() {
  DestroyWindow(message_window_);
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
  ::EnterCriticalSection(&lock_);
  tasks_[++task_id_] = task;
  ::LeaveCriticalSection(&lock_);
  ::PostMessage(message_window_, WM_USER, task_id_, 0L);
}

void NodeIntegrationWin::OnTask(int id) {
  std::function<void()> task;
  {
    ::EnterCriticalSection(&lock_);
    task = tasks_[id];
    tasks_.erase(id);
    ::LeaveCriticalSection(&lock_);
  }
  task();
}

// static
LRESULT CALLBACK NodeIntegrationWin::WndProc(
    HWND hwnd, UINT message, WPARAM wparam, LPARAM lparam) {
  NodeIntegrationWin* self = reinterpret_cast<NodeIntegrationWin*>(
      GetWindowLongPtr(hwnd, GWLP_USERDATA));

  switch (message) {
    // Set up the self before handling WM_CREATE.
    case WM_CREATE: {
      CREATESTRUCT* cs = reinterpret_cast<CREATESTRUCT*>(lparam);
      self = reinterpret_cast<NodeIntegrationWin*>(cs->lpCreateParams);
      ::SetWindowLongPtr(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(self));
      break;
    }

    // Clear the pointer to stop calling the self once WM_DESTROY is
    // received.
    case WM_DESTROY: {
      ::SetWindowLongPtr(hwnd, GWLP_USERDATA, NULL);
      break;
    }

    // Handle the timer message.
    case WM_USER: {
      self->OnTask(static_cast<int>(wparam));
      return 0;
    }
  }

  return DefWindowProc(hwnd, message, wparam, lparam);
}

// static
NodeIntegration* NodeIntegration::Create() {
  return new NodeIntegrationWin();
}

}  // namespace yode
