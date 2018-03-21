// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#include "src/yode.h"

#include <gtk/gtk.h>

#include "node/src/env-inl.h"

namespace yode {

void Init(node::Environment* env) {
  gtk_init(nullptr, nullptr);
}

void RunLoop(node::Environment* env) {
  gtk_main();  // block until quit
}

}  // namespace yode
