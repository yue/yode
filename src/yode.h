// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#ifndef SRC_YODE_H_
#define SRC_YODE_H_

namespace node {
class Environment;
}

namespace yode {

// Initialize Node and enter GUI message loop.
int Start(int argc, char* argv[]);

// Run the GUI message loop for once.
bool RunLoop(node::Environment* env);

}  // namespace yode

#endif  // SRC_YODE_H_
