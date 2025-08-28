import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User, UserSwipe, UserFollow, Guild, GuildMembership } from "@/api/entities";
import ProfileCard from "./ProfileCard";
import ItsAMatchModal from "./ItsAMatchModal";
import { Button } from "@/components/ui/button";
import { UserPlus, X, Sparkles, UserSearch, RefreshCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUserDisplayName } from "../shared/UserDisplay";

export default function MatchmakingView() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [hasUserListAccess, setHasUserListAccess] = useState(false);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setCurrentIndex(0); // Reset index on refresh
    try {
      const me = await User.me();
      setCurrentUser(me);
      
      // Try to get users list, but handle the case where it fails
      try {
        const allUsers = await User.list();
        setHasUserListAccess(true);
        
        // Get users already swiped or followed to filter them out
        const swipedUsers = await UserSwipe.filter({ swiper_email: me.email });
        const swipedEmails = new Set(swipedUsers.map(s => s.swiped_email));

        const followedUsers = await UserFollow.filter({ follower_email: me.email });
        const followedEmails = new Set(followedUsers.map(f => f.following_email));
        
        const potentialMatches = allUsers.filter(u => 
          u.email !== me.email && 
          !swipedEmails.has(u.email) &&
          !followedEmails.has(u.email)
        );
        
        // Shuffle users for a fresh experience on reload
        const shuffledUsers = potentialMatches.sort(() => 0.5 - Math.random());
        setUsers(shuffledUsers);
      } catch (userListError) {
        console.warn("Cannot access full user list:", userListError);
        setHasUserListAccess(false);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading matchmaking data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canSwipe = currentIndex < users.length && hasUserListAccess;
  const activeUser = canSwipe ? users[currentIndex] : null;

  const handleSwipe = async (direction) => {
    if (!canSwipe || !currentUser) return;

    const status = direction === 'right' ? 'liked' : 'passed';
    
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    
    try {
      await UserSwipe.create({
        swiper_email: currentUser.email,
        swiped_email: activeUser.email,
        status: status,
      });

      if (status === 'liked') {
        // Check for a match
        const otherUserLikesBack = await UserSwipe.filter({
          swiper_email: activeUser.email,
          swiped_email: currentUser.email,
          status: 'liked'
        });

        if (otherUserLikesBack.length > 0) {
          // It's a match! Create a party chat.
          const partyName = `Party: ${getUserDisplayName(currentUser)} & ${getUserDisplayName(activeUser)}`;
          const partyDescription = `A private party chat for collaboration. All conversations and projects shared here are documented and visible only to party members.`;
          
          const newParty = await Guild.create({
            name: partyName,
            description: partyDescription,
            guild_type: 'custom',
            is_party: true,
            is_public: false,
          });

          await GuildMembership.create({ guild_id: newParty.id, user_email: currentUser.email, role: 'owner' });
          await GuildMembership.create({ guild_id: newParty.id, user_email: activeUser.email, role: 'owner' });

          setMatchData({ user1: currentUser, user2: activeUser, guild: newParty });
        }
      }
    } catch (error) {
      console.error("Error processing action:", error);
    }
  };

  const hasProfile = useMemo(() => {
    if (!currentUser) return false;
    return !!(currentUser.bio && currentUser.skills && currentUser.skills.length > 0);
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="w-full max-w-sm h-[500px] bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="creator-card max-w-2xl mx-auto p-8 text-center">
        <Sparkles className="w-12 h-12 text-violet-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Complete Your Profile to Start Matching</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add your bio and skills to let other creators know what you're all about.
        </p>
        <Link to={createPageUrl("Settings") + "?return=matchmaking"}>
          <Button className="creator-btn">
            Complete Profile
          </Button>
        </Link>
      </div>
    );
  }

  if (!hasUserListAccess) {
    return (
      <div className="creator-card max-w-2xl mx-auto p-8 text-center">
        <UserSearch className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Matchmaking Temporarily Unavailable</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The matchmaking feature is currently being updated. Please check back later or connect with other creators through guilds.
        </p>
        <Link to={createPageUrl("Community")}>
          <Button className="creator-btn">
            Browse Guilds Instead
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center space-y-8">
      {matchData && (
        <ItsAMatchModal
          user1={matchData.user1}
          user2={matchData.user2}
          guild={matchData.guild}
          onClose={() => setMatchData(null)}
        />
      )}
      <div className="relative w-full max-w-sm h-[500px] flex items-center justify-center">
        <AnimatePresence>
          {canSwipe ? (
            users.slice(currentIndex, currentIndex + 2).reverse().map((user, index) => {
              const isTopCard = index === (users.slice(currentIndex, currentIndex + 2).length - 1);
              return (
                <ProfileCard
                  key={user.id}
                  user={user}
                  onSwipe={handleSwipe}
                  isTopCard={isTopCard}
                />
              );
            })
          ) : (
            <div className="creator-card w-full h-full flex flex-col items-center justify-center text-center p-8">
              <UserSearch className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">That's Everyone!</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
                You've seen all available profiles for now. Check back later or refresh to see more.
              </p>
              <Button onClick={loadData} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {canSwipe && (
        <div className="flex items-center gap-6">
          <Button
            onClick={() => handleSwipe('left')}
            className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            variant="ghost"
            size="icon"
          >
            <X className="w-10 h-10 text-red-500" />
          </Button>
          <Button
            onClick={() => handleSwipe('right')}
            className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            variant="ghost"
            size="icon"
          >
            <UserPlus className="w-12 h-12 text-green-500" />
          </Button>
        </div>
      )}
    </div>
  );
}