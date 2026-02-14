import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HelpSection = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="help-section"
    style={{
      background: "var(--card-bg)",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--border-color)",
      height: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "var(--bg-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--brand-red)",
        }}
      >
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: "18px" }}>{title}</h3>
    </div>
    <div style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
      {children}
    </div>
  </motion.div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-color)",
        marginBottom: "8px",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "16px 0",
          background: "none",
          border: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontSize: "16px",
          fontWeight: "500",
        }}
      >
        {question}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          style={{ display: "inline-block" }}
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                paddingBottom: "16px",
                color: "#606060",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpTopics = [
    {
      title: "Getting Started",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      ),
      content: (
        <ul style={{ paddingLeft: "20px", margin: 0 }}>
          <li>Navigate Home to see recommendations</li>
          <li>Use Search to find specific content</li>
          <li>Explore Categories for topics you like</li>
        </ul>
      ),
    },
    {
      title: "Watch Videos",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      ),
      content: (
        <ul style={{ paddingLeft: "20px", margin: 0 }}>
          <li>Click any video thumbnail to play</li>
          <li>Like, comment, and share videos</li>
          <li>Save to Watch Later for future viewing</li>
        </ul>
      ),
    },
    {
      title: "Create Content",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      ),
      content: (
        <ul style={{ paddingLeft: "20px", margin: 0 }}>
          <li>Create a channel to start uploading</li>
          <li>Upload videos or create Shorts</li>
          <li>Manage your content in YouTube Studio</li>
        </ul>
      ),
    },
    {
      title: "Manage Account",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      content: (
        <ul style={{ paddingLeft: "20px", margin: 0 }}>
          <li>Update your profile and avatar</li>
          <li>Manage privacy settings</li>
          <li>View your watch history</li>
        </ul>
      ),
    },
  ];

  const faqs = [
    {
      question: "How do I upload a video?",
      answer:
        "Click the Create button (+) in the top-right corner, select 'Upload video', and follow the instructions to select your file and add details.",
    },
    {
      question: "How can I delete my channel?",
      answer:
        "Go to Settings > Channel Status. If you're the channel owner, you'll see an option to delete your channel. This action is permanent.",
    },
    {
      question: "Why can't I comment on videos?",
      answer:
        "You must be logged in to comment on videos. Make sure you have signed in to your account.",
    },
    {
      question: "How do I change my channel name?",
      answer:
        "Go to Settings, and under the Channel section, you can edit your channel name.",
    },
  ];

  const filteredTopics = helpTopics.filter((topic) =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      {/* Hero Section */}
      <div
        style={{
          textAlign: "center",
          padding: "40px 0",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "24px" }}>
          How can we help you?
        </h1>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <input
            type="text"
            placeholder="Describe your issue"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px 16px 48px",
              fontSize: "16px",
              borderRadius: "24px",
              border: "1px solid var(--border-color)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              outline: "none",
              background: "var(--card-bg)",
              color: "var(--text-primary)",
            }}
          />
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#606060"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </div>
      </div>

      {/* Quick Help Topics */}
      <h2 style={{ marginBottom: "24px" }}>Browse help topics</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
        }}
      >
        {filteredTopics.map((topic, index) => (
          <HelpSection key={index} title={topic.title} icon={topic.icon}>
            {topic.content}
          </HelpSection>
        ))}
      </div>

      {/* FAQ Section */}
      <h2 style={{ marginBottom: "24px" }}>Popular Questions</h2>
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid var(--border-color)",
        }}
      >
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#606060" }}>
            No matching questions found.
          </p>
        )}
      </div>

      {/* Footer Support Link */}
      <div
        style={{
          marginTop: "48px",
          textAlign: "center",
          color: "#606060",
        }}
      >
        <p>Need more help?</p>
        <p>
          Visit the{" "}
          <a
            href="https://support.google.com/youtube"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#065fd4", textDecoration: "none" }}
          >
            YouTube Help Community
          </a>{" "}
          for more support.
        </p>
      </div>
    </div>
  );
}
