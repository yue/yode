// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#ifndef SRC_YODE_H_
#define SRC_YODE_H_

#include <memory>

namespace node {
class Environment;
}

namespace yode {

// Initialize Node and enter GUI message loop.
int Start(int argc, char* argv[]);

// Initialize platform specific code.
void Init(node::Environment* env);

// Run the GUI message loop for once, implemented by different platforms.
bool RunLoop(node::Environment* env);

}  // namespace yode

#endif  // SRC_YODE_H_
