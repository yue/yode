// Copyright 2014 GitHub, Inc.
// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the MIT license.

#ifndef SRC_NODE_INTEGRATION_WIN_H_
#define SRC_NODE_INTEGRATION_WIN_H_

#include <memory>
#include <unordered_map>

#include "src/node_integration.h"

namespace yode {

class NodeIntegrationWin : public NodeIntegration {
 public:
  NodeIntegrationWin();
  ~NodeIntegrationWin() override;

 private:
  void PollEvents() override;
  void PostTask(const std::function<void()>& task) override;

  static void CALLBACK OnTimer(HWND, UINT, UINT_PTR event, DWORD);

  static CRITICAL_SECTION lock_;
  static std::unordered_map<UINT_PTR, std::function<void()>> tasks_;

  DISALLOW_COPY_AND_ASSIGN(NodeIntegrationWin);
};

}  // namespace yode

#endif  // SRC_NODE_INTEGRATION_WIN_H_
