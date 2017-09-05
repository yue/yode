// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include "node/src/env-inl.h"

namespace yode {

void Init(node::Environment* env) {
#if _DEBUG
  // Show system dialog on crash.
  ::SetErrorMode(::GetErrorMode() & ~SEM_NOGPFAULTERRORBOX);
#endif
}

bool RunLoop(node::Environment* env) {
  MSG msg;
  if (::GetMessage(&msg, NULL, 0, 0)) {
    ::TranslateMessage(&msg);
    ::DispatchMessage(&msg);
    return true;
  }
  return uv_run(env->event_loop(), UV_RUN_ONCE);
}

}  // namespace yode
