
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, UserPlus, Eye, Star, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUserDisplayName } from "../shared/UserDisplay";
import { TeamApplication, UserFollow } from "@/api/entities"; // Added UserFollow
import TeamApplicationModal from "./TeamApplicationModal";

const roleTypeColors = {
  creator: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  developer: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", 
  freelancer: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  explorer: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
};

const FeaturedQuestCard = ({ quest, index, currentUser, onTeamApplication }) => {
  const [showTeamModal, setShowTeamModal] = useState(false);

  const handleTeamApplication = async (applicationData) => {
    if (!currentUser) {
      alert("You must be logged in to apply for a team.");
      return;
    }

    try {
      await TeamApplication.create({
        quest_id: quest.id,
        applicant_email: currentUser.email,
        ...applicationData
      });
      
      setShowTeamModal(false);
      alert("Application submitted successfully!");
      
      if (onTeamApplication) {
        onTeamApplication();
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="creator-card p-5 flex flex-col justify-between h-full group hover:shadow-lg transition-shadow"
      >
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {quest.request_type === 'team_help' ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 border text-xs dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">
                  <UserPlus className="w-3 h-3" />
                  Team Wanted
                </Badge>
              ) : quest.request_type === 'feedback' ? (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1 border text-xs dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700">
                  <Eye className="w-3 h-3" />
                  Feedback Wanted
                </Badge>
              ) : null}
            </div>
            {quest.average_rating && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{quest.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              by {getUserDisplayName(quest.creator_user || quest.created_by)}
            </p>
            <Link 
              to={createPageUrl("QuestDetail") + "?id=" + quest.id}
              className="block"
            >
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {quest.title}
              </h3>
            </Link>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {quest.description}
          </p>

          {quest.request_type === 'team_help' && quest.team_roles && quest.team_roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {quest.team_roles.slice(0, 2).map((role, idx) => (
                <Badge key={idx} className={`${roleTypeColors[role.role_type]} border text-xs`}>
                  {role.count} {role.role_type}{role.count > 1 ? 's' : ''}
                </Badge>
              ))}
              {quest.team_roles.length > 2 && (
                <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                  +{quest.team_roles.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {quest.request_type === 'team_help' ? (
          <Button 
            onClick={() => setShowTeamModal(true)}
            size="sm"
            className="w-full creator-btn"
          >
            Join Team
            <UserPlus className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Link to={createPageUrl("QuestDetail") + "?id=" + quest.id + "&action=feedback"}>
            <Button 
              size="sm"
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700"
            >
              Give Feedback
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </motion.div>

      {showTeamModal && quest.request_type === 'team_help' && (
        <TeamApplicationModal
          quest={quest}
          availableRoles={quest.team_roles || []}
          onClose={() => setShowTeamModal(false)}
          onSubmit={handleTeamApplication}
        />
      )}
    </>
  );
};

export default function FeaturedQuests({ quests: allQuests, isLoading, currentUser }) {
  const [filteredQuests, setFilteredQuests] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [rejectedQuestIds, setRejectedQuestIds] = useState(new Set());

  const loadFilteredQuests = useCallback(async () => {
    if (isLoading) return;

    if (!currentUser) {
      // For guests, show all quests with open requests as before
      const openQuests = allQuests.filter(q => 
        !q.is_archived &&
        (q.request_type === 'team_help' || q.request_type === 'feedback') && 
        q.status !== 'completed' && 
        q.status !== 'closed'
      );
      setFilteredQuests(openQuests.slice(0, 9));
      return;
    }

    try {
      // Get who the current user is following
      const followingList = await UserFollow.filter({ follower_email: currentUser.email });
      const followedEmails = new Set(followingList.map(f => f.following_email));

      // Get all rejected applications for current user to hide them
      const userApplications = await TeamApplication.filter({ 
        applicant_email: currentUser.email, 
        status: 'rejected' 
      });
      const rejectedIds = new Set(userApplications.map(app => app.quest_id));
      setRejectedQuestIds(rejectedIds);

      // Filter quests to show only those from followed users with open requests
      const openQuests = allQuests.filter(q => 
        !q.is_archived &&
        (q.request_type === 'team_help' || q.request_type === 'feedback') && 
        q.status !== 'completed' && 
        q.status !== 'closed' &&
        followedEmails.has(q.created_by) && // Only show quests from followed users
        (showAll || !rejectedIds.has(q.id))
      );

      setFilteredQuests(openQuests.slice(0, 9));
    } catch (error) {
      console.error("Error filtering quests:", error);
      // Fallback to showing nothing on error for logged-in user
      setFilteredQuests([]);
    }
  }, [allQuests, isLoading, currentUser, showAll]);

  useEffect(() => {
    loadFilteredQuests();
  }, [loadFilteredQuests]);

  const handleTeamApplicationSubmitted = () => {
    // Refresh the filtered quests to potentially hide the quest if user was rejected before
    loadFilteredQuests();
  };

  const handleRefreshRequests = () => {
    setShowAll(true);
    // Setting showAll to true will trigger the useEffect, which calls loadFilteredQuests
  };

  if (isLoading) {
    return (
      <div className="creator-card p-6">
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Hide the entire component if there are no quests to show
  if (filteredQuests.length === 0) {
    // Optionally, show a message for logged-in users
    if (currentUser) {
      return (
        <div className="creator-card p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="text-yellow-500" />
              Opportunities From Your Network
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Requests from creators you follow will appear here.
            </p>
            <Link to={createPageUrl("Community") + "?tab=matchmaking"}>
              <Button variant="link" className="mt-2">Find creators to follow</Button>
            </Link>
          </CardContent>
        </div>
      );
    }
    return null;
  }

  const hiddenCount = currentUser && !showAll ? rejectedQuestIds.size : 0;

  return (
    <div className="creator-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Zap className="text-blue-500" />
          Open Requests ({filteredQuests.length})
        </h2>
        {hiddenCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {hiddenCount} hidden
            </span>
            <Button 
              onClick={handleRefreshRequests} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Show All
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuests.map((quest, index) => (
          <FeaturedQuestCard 
            key={quest.id} 
            quest={quest} 
            index={index} 
            currentUser={currentUser}
            onTeamApplication={handleTeamApplicationSubmitted}
          />
        ))}
      </div>
    </div>
  );
}
