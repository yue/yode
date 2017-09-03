// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#ifndef SRC_NODE_INTEGRATION_WIN_H_
#define SRC_NODE_INTEGRATION_WIN_H_

#include "src/node_integration.h"

namespace yode {

class NodeIntegrationWin : public NodeIntegration {
 public:
  NodeIntegrationWin();
  ~NodeIntegrationWin() override;

 private:
  void PollEvents() override;

  DISALLOW_COPY_AND_ASSIGN(NodeIntegrationWin);
};

}  // namespace yode

#endif  // SRC_NODE_INTEGRATION_WIN_H_
