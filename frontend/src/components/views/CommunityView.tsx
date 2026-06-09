"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Send,
  Sparkles,
  Award,
  Leaf
} from "lucide-react";

interface Post {
  id: number;
  user: string;
  level: number;
  text: string;
  likes: number;
  comments: number;
  time: string;
  hasLiked?: boolean;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    user: "Rohan Verma",
    level: 3,
    text: "Just completed the No Vehicle Day challenge! Commuted to the office by metro and walked during lunch. Saved around 4.5kg of CO2 today. Highly recommend trying it! 🚇🚶‍♂️",
    likes: 24,
    comments: 6,
    time: "2 hours ago"
  },
  {
    id: 2,
    user: "Aaran Singh",
    level: 1,
    text: "Reported a major plastic dumping site near the local lake this morning. Got verified by the Municipal Corporation within 30 minutes! Thanks EcoSphere for routing this so fast. 🚮",
    likes: 42,
    comments: 12,
    time: "4 hours ago"
  },
  {
    id: 3,
    user: "Green Canopy NGO",
    level: 5,
    text: "We are holding our weekly Tree Plantation Drive in Cubbon Park this Saturday starting at 8:00 AM. Saplings, soil, and tools will be provided. Register under the 'Events' tab! 🌳🌱",
    likes: 56,
    comments: 18,
    time: "1 day ago"
  }
];

export default function CommunityView() {
  const { user } = useApp();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState("");

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      user: user?.name || "Ananya Sharma",
      level: user?.level || 2,
      text: newPostText,
      likes: 0,
      comments: 0,
      time: "Just now"
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostText("");
  };

  const handleLike = (id: number) => {
    setPosts((prev) => 
      prev.map((post) => {
        if (post.id === id) {
          const hasLiked = !post.hasLiked;
          return {
            ...post,
            hasLiked,
            likes: hasLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Eco Community 👥</h1>
        <p className="text-slate-500 mt-1">Connect with other environmental advocates, share progress, and coordinate cleanup efforts.</p>
      </div>

      {/* Share Post Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handlePostSubmit} className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/25">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Share your eco accomplishments, challenges completed, or environmental thoughts..."
              rows={3}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 resize-none"
              required
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share Update</span>
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fade-in"
          >
            {/* User Profile Card */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                  {post.user[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>{post.user}</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      Lvl {post.level}
                    </span>
                  </h4>
                  <span className="text-[9px] text-slate-400 font-medium">{post.time}</span>
                </div>
              </div>
              
              <button className="text-slate-400 hover:text-slate-600 transition">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Post Content */}
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
              {post.text}
            </p>

            {/* Interactive counts */}
            <div className="flex items-center gap-6 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400">
              <button 
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1.5 transition ${post.hasLiked ? "text-rose-600" : "hover:text-rose-500"}`}
              >
                <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-current" : ""}`} />
                <span>{post.likes} Likes</span>
              </button>
              <button 
                onClick={() => alert("Comments panel simulation!")}
                className="flex items-center gap-1.5 hover:text-emerald-600 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments} Comments</span>
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
