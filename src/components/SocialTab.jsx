import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Heart, Send, Image as ImageIcon, Sparkles } from "lucide-react";
import { ALL_BADGES } from "../utils";

const MEME_OPTIONS = [
  { id: "meme_paper", url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=300", title: "Crisis del Papel" },
  { id: "meme_clean", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300", title: "Trono Limpio" },
  { id: "meme_read", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300", title: "Biblioteca de Baño" },
  { id: "meme_relax", url: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=300", title: "Spa Lavanda" }
];

export default function SocialTab({ 
  feedPosts, 
  chatMessages, 
  users, 
  activeUser, 
  onAddPost, 
  onLikePost, 
  onAddComment, 
  onSendChatMessage 
}) {
  const [subTab, setSubTab] = useState("feed"); // "feed" | "chat"
  
  // Feed composer state
  const [newPostText, setNewPostText] = useState("");
  const [selectedMeme, setSelectedMeme] = useState(null);
  
  // Comment input state (keyed by postId)
  const [commentInputs, setCommentInputs] = useState({});
  
  // Chat state
  const [newChatMessage, setNewChatMessage] = useState("");
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (subTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, subTab]);

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedMeme) return;

    const memeUrl = selectedMeme ? MEME_OPTIONS.find(m => m.id === selectedMeme)?.url : null;
    onAddPost(newPostText, memeUrl);
    
    setNewPostText("");
    setSelectedMeme(null);
  };

  const handleCommentSubmit = (postId) => {
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    onAddComment(postId, text);
    setCommentInputs({
      ...commentInputs,
      [postId]: ""
    });
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    onSendChatMessage(newChatMessage);
    setNewChatMessage("");
  };

  // Helper to format timestamps relative to now
  const formatRelativeTime = (isoString) => {
    const date = new Date(isoString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Hace un momento";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="social-tab-container">
      {/* Subtab Toggle Buttons */}
      <div className="social-header-toggle">
        <button 
          className={`toggle-tab-btn ${subTab === "feed" ? "active" : ""}`}
          onClick={() => setSubTab("feed")}
        >
          📰 Feed Social
        </button>
        <button 
          className={`toggle-tab-btn ${subTab === "chat" ? "active" : ""}`}
          onClick={() => setSubTab("chat")}
        >
          💬 Chat Lounge
        </button>
      </div>

      {subTab === "feed" ? (
        <div className="feed-view animate-fadeIn">
          {/* Post Creator Card */}
          <div className="glass-card feed-composer">
            <h4 className="meme-picker-title">¿Qué está pasando en el baño?</h4>
            <form onSubmit={handlePostSubmit}>
              <textarea 
                className="feed-input"
                placeholder="Escribe un estado gracioso, una idea brillante de baño o sube un meme..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
              
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span className="meme-picker-title">
                  <ImageIcon size={12} style={{ marginRight: "4px" }} />
                  Adjuntar un meme gracioso:
                </span>
                
                <div className="meme-grid">
                  {MEME_OPTIONS.map(meme => (
                    <div 
                      key={meme.id} 
                      className={`meme-option ${selectedMeme === meme.id ? "selected" : ""}`}
                      onClick={() => setSelectedMeme(selectedMeme === meme.id ? null : meme.id)}
                      title={meme.title}
                    >
                      <img src={meme.url} alt={meme.title} className="meme-option-img" />
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ marginTop: "16px" }}
                disabled={!newPostText.trim() && !selectedMeme}
              >
                <Sparkles size={16} /> Publicar en el Muro
              </button>
            </form>
          </div>

          {/* Feed Posts List */}
          {feedPosts.map(post => {
            const author = users.find(u => u.id === post.userId);
            const isLiked = post.likedBy && post.likedBy.includes(activeUser.id);
            if (!author) return null;

            return (
              <div key={post.id} className="feed-post animate-fadeIn">
                <div className="post-header">
                  <div className="post-author">
                    <img src={author.avatar} alt={author.name} className="post-author-avatar" />
                    <div>
                      <div className="post-author-name">{author.name}</div>
                      <div className="post-author-role">{author.role}</div>
                    </div>
                  </div>
                  <span className="post-time">{formatRelativeTime(post.timestamp)}</span>
                </div>

                <div className="post-content">
                  {post.content}
                </div>

                {post.image && (
                  <img src={post.image} alt="Post Attachment" className="post-image" />
                )}

                <div className="post-actions">
                  <button 
                    className={`post-action-btn ${isLiked ? "liked" : ""}`}
                    onClick={() => onLikePost(post.id, activeUser.id)}
                  >
                    <Heart size={16} /> {post.likes} {post.likes === 1 ? "Me gusta" : "Me gustas"}
                  </button>
                  <span className="post-action-btn">
                    <MessageSquare size={16} /> {post.comments.length} {post.comments.length === 1 ? "Comentario" : "Comentarios"}
                  </span>
                </div>

                {/* Comments */}
                <div className="post-comments">
                  {post.comments.map((comm, cidx) => {
                    const commentUser = users.find(u => u.id === comm.userId);
                    return (
                      <div key={cidx} className="post-comment">
                        <span className="post-comment-user">{commentUser?.name || comm.userId}:</span>
                        <span className="post-comment-text">{comm.text}</span>
                      </div>
                    );
                  })}

                  <div className="comment-input-box">
                    <input 
                      type="text" 
                      className="comment-input"
                      placeholder="Escribe un comentario..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCommentSubmit(post.id);
                      }}
                    />
                    <button 
                      className="comment-submit-btn"
                      onClick={() => handleCommentSubmit(post.id)}
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Chat View */
        <div className="chat-container animate-fadeIn">
          <div className="chat-messages-box">
            {chatMessages.map(msg => {
              const sender = users.find(u => u.id === msg.userId);
              const isSelf = msg.userId === activeUser.id;
              
              if (msg.system) {
                return (
                  <div key={msg.id} className={`chat-system-message ${msg.status || ""}`}>
                    <span>{msg.text}</span>
                  </div>
                );
              }

              if (!sender) return null;

              return (
                <div key={msg.id} className={`chat-message ${isSelf ? "self" : ""}`}>
                  <img src={sender.avatar} alt={sender.name} className="chat-message-avatar" />
                  <div className="chat-message-bubble">
                    <div className="chat-message-info">
                      <span className="chat-message-sender">{sender.name}</span>
                      <div className="chat-message-badges">
                        {sender.badges.map(badgeId => {
                          const badge = ALL_BADGES[badgeId];
                          return (
                            <span 
                              key={badgeId} 
                              className="chat-message-badge"
                              title={badge?.title}
                            >
                              {badge?.icon}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span className="chat-message-text">{msg.text}</span>
                    <span className="chat-message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="chat-input-area">
            <input 
              type="text" 
              className="chat-textbox"
              placeholder="Habla con la fila o comparte tus reflexiones..."
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
