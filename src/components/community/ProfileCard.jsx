import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export default function ProfileCard({ user, onSwipe, isTopCard }) {
  return (
    <motion.div
      drag={isTopCard}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.x > 100) {
          onSwipe('right');
        } else if (info.offset.x < -100) {
          onSwipe('left');
        }
      }}
      className="absolute"
      style={{
        width: '100%',
        height: '100%',
      }}
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full h-full creator-card shadow-2xl flex flex-col overflow-hidden">
        <div className="relative h-1/2 bg-gray-100">
          {user.github_avatar_url ? (
            <img src={user.github_avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <User className="w-24 h-24 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-2xl font-bold text-white">{user.full_name}</h3>
            <p className="text-sm text-gray-200">{user.title}</p>
          </div>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
              {user.bio || "No bio yet."}
            </p>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {user.skills && user.skills.length > 0 ? (
                  user.skills.map(skill => (
                    <Badge key={skill} className="bg-violet-100 text-violet-800">{skill}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills listed.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}