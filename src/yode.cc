// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include "node/src/env-inl.h"
#include "node/src/node.h"

namespace yode {

int Start(int argc, char* argv[]) {
  node::SetRunLoop(&RunLoop);
  return node::Start(argc, argv);
}

bool RunLoop(node::Environment* env) {
  return uv_run(env->event_loop(), UV_RUN_ONCE);
}

}  // namespace yode
