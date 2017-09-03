// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#ifndef SRC_NODE_INTEGRATION_MAC_H_
#define SRC_NODE_INTEGRATION_MAC_H_

#include "src/node_integration.h"

namespace yode {

class NodeIntegrationMac : public NodeIntegration {
 public:
  NodeIntegrationMac();
  ~NodeIntegrationMac() override;

 private:
  void PollEvents() override;
  void PostTask(const std::function<void()>& task) override;

  DISALLOW_COPY_AND_ASSIGN(NodeIntegrationMac);
};

}  // namespace yode

#endif  // SRC_NODE_INTEGRATION_MAC_H_
