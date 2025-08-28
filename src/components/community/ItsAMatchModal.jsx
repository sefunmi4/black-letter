import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ItsAMatchModal({ user1, user2, guild, onClose }) {
  if (!user1 || !user2 || !guild) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="creator-card max-w-md text-center p-8">
        <DialogHeader>
          <div className="relative w-48 h-24 mx-auto mb-6">
            <img
              src={user1.github_avatar_url || `https://avatar.vercel.sh/${user1.email}`}
              alt={user1.full_name}
              className="w-24 h-24 rounded-full object-cover absolute top-0 left-0 border-4 border-white shadow-lg"
            />
            <img
              src={user2.github_avatar_url || `https://avatar.vercel.sh/${user2.email}`}
              alt={user2.full_name}
              className="w-24 h-24 rounded-full object-cover absolute top-0 right-0 border-4 border-white shadow-lg"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center border-4 border-white">
                <Heart className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold text-gray-800 dark:text-white">It's a Match!</DialogTitle>
          <DialogDescription className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            You and {user2.full_name} have liked each other.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            A private "Party Chat" has been created for you to collaborate and share ideas.
          </p>
          <Link to={createPageUrl("GuildDetail") + `?id=${guild.id}`}>
            <Button className="creator-btn w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chatting
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="w-full text-gray-600 dark:text-gray-400">
            Keep Swiping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}