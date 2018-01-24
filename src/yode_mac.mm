// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#import <Cocoa/Cocoa.h>

#include "node/src/env-inl.h"

namespace yode {

void Init(node::Environment* env) {
  [NSApplication sharedApplication];
  [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
}

bool RunLoop(node::Environment* env) {
  [NSApp run];  // block until quit
  return uv_run(env->event_loop(), UV_RUN_DEFAULT);
}

}  // namespace yode
