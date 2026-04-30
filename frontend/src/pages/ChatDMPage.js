import React from "react";
import { useLocation } from "react-router-dom";
import ChatApp from "../components/chatting";

const ChatDMPage = ({ user, chatRef }) => {
  const location = useLocation();
  const chatTarget = location.state?.chatTarget || null;

  return (
    <div style={{ minHeight: "calc(100vh - 120px)" }}>
      <ChatApp user={user} initialOther={chatTarget} openRef={chatRef} forceOpen />
    </div>
  );
};

export default ChatDMPage;
