
import React, { useState, useEffect } from "react";
import { Quest, User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FolderKanban, 
  Plus, 
  FileText, 
  Folder, 
  MessageSquare,
  User as UserIcon,
  Edit
} from "lucide-react";
import { format } from "date-fns";

const questTypeIcons = {
  discussion: MessageSquare,
  file: FileText,
  folder: Folder,
};

const QuestItem = ({ quest }) => {
  const Icon = questTypeIcons[quest.quest_type] || MessageSquare;
  return (
    <Card className="creator-card hover:border-blue-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <Link to={createPageUrl("QuestDetail") + `?id=${quest.id}`}>
              <p className="font-semibold text-gray-900 hover:text-blue-600">{quest.title}</p>
            </Link>
            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{quest.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
              <span>{format(new Date(quest.created_date), "MMM d, yyyy")}</span>
              <Badge variant="outline" className="capitalize">{quest.status}</Badge>
              <Badge variant="secondary" className="capitalize">{quest.quest_type}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Workspace() {
  const [userQuests, setUserQuests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        if (user) {
          // Only fetch top-level quests (no parent_quest_id)
          const allQuests = await Quest.filter({ created_by: user.email }, "-created_date");
          const topLevelQuests = allQuests.filter(quest => !quest.parent_quest_id);
          setUserQuests(topLevelQuests);
        }
      } catch (error) {
        console.error("Error loading workspace data:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-48 creator-card animate-pulse mb-8"></div>
        <div className="h-24 creator-card animate-pulse"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <p>Please log in to see your workspace.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="creator-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border flex-shrink-0">
                {currentUser?.github_avatar_url ? (
                  <img src={currentUser.github_avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-gray-500" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900">{currentUser.full_name}</h1>
                {currentUser.title && <p className="text-lg text-blue-600 font-medium mt-1">{currentUser.title}</p>}
                {currentUser.bio && <p className="text-gray-600 mt-2 max-w-xl">{currentUser.bio}</p>}
              </div>
              <Link to={createPageUrl("Settings")}>
                <Button variant="outline" className="flex-shrink-0">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Content */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-blue-600" />
              My Posts
            </h2>
            <p className="text-gray-600 mt-1">
              Your top-level posts, folders, and projects. Click to explore nested content.
            </p>
          </div>
          <Link to={createPageUrl("CreateQuest")}>
            <Button className="creator-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {userQuests.length > 0 ? (
          <div className="space-y-4">
            {userQuests.map(quest => (
              <QuestItem key={quest.id} quest={quest} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 creator-card">
            <h2 className="text-xl font-semibold text-gray-800">Your workspace is empty.</h2>
            <p className="text-gray-500 mt-2 mb-6">
              Create a post, file, or project to get started.
            </p>
            <Link to={createPageUrl("CreateQuest")}>
              <Button className="creator-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
