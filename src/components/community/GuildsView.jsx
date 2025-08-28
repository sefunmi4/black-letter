
import React, { useState, useEffect } from "react";
import { Guild, GuildMembership, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Search,
  Star,
  Crown,
  Target,
  ArrowRight,
  Globe,
  Lock,
  Code,
  Palette,
  Briefcase,
  Compass,
  Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const guildTypeIcons = {
  creator: Palette,
  developer: Code,
  freelancer: Briefcase,
  explorer: Compass,
  custom: Users
};

const guildTypeColors = {
  creator: "bg-purple-100 text-purple-700 border-purple-200",
  developer: "bg-blue-100 text-blue-700 border-blue-200",
  freelancer: "bg-green-100 text-green-700 border-green-200",
  explorer: "bg-orange-100 text-orange-700 border-orange-200",
  custom: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function GuildsView() {
  const [guilds, setGuilds] = useState([]);
  const [userMemberships, setUserMemberships] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [guildsData, user] = await Promise.all([
        Guild.filter({ is_archived: false }, "-created_date"),
        User.me().catch(() => null)
      ]);
      
      setGuilds(guildsData);
      setCurrentUser(user);

      if (user) {
        const memberships = await GuildMembership.filter({ user_email: user.email });
        setUserMemberships(memberships);
      }
    } catch (error) {
      console.error("Error loading guilds:", error);
    }
    setIsLoading(false);
  };

  const handleJoinGuild = async (guild) => {
    if (!currentUser) return;
    
    try {
      await GuildMembership.create({
        guild_id: guild.id,
        user_email: currentUser.email,
        joined_date: new Date().toISOString()
      });
      
      // Update member count
      await Guild.update(guild.id, {
        member_count: (guild.member_count || 0) + 1
      });
      
      loadData(); // Reload to update UI
    } catch (error) {
      console.error("Error joining guild:", error);
    }
  };

  const isUserMember = (guildId) => {
    return userMemberships.some(m => m.guild_id === guildId);
  };

  const filteredGuilds = guilds.filter(guild =>
    guild.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guild.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate default and custom guilds
  const defaultGuilds = filteredGuilds.filter(g => g.is_default);
  const customGuilds = filteredGuilds.filter(g => !g.is_default);

  const renderGuildCard = (guild, index) => {
    const GuildIcon = guildTypeIcons[guild.guild_type] || Users;
    const isMember = isUserMember(guild.id);

    return (
      <motion.div
        key={guild.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="w-full"
      >
        <Card className="creator-card glow-effect transition-all duration-300 group cursor-pointer h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${guildTypeColors[guild.guild_type]}`}>
                  <GuildIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-gray-800 group-hover:text-violet-600 transition-colors">
                    {guild.name}
                    {guild.is_default && (
                      <Badge variant="outline" className="ml-2 text-xs border-violet-300 text-violet-600">
                        <Crown className="w-3 h-3 mr-1" />
                        Official
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    {guild.is_public ? (
                      <Globe className="w-3 h-3 text-green-500" />
                    ) : (
                      <Lock className="w-3 h-3 text-orange-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {guild.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${guildTypeColors[guild.guild_type]} border-current text-xs whitespace-nowrap`}
              >
                {guild.guild_type}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm line-clamp-3">
              {guild.description}
            </p>

            {guild.specializations && guild.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {guild.specializations.slice(0, 3).map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs bg-gray-100 text-gray-600 whitespace-nowrap">
                    {spec}
                  </Badge>
                ))}
                {guild.specializations.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 whitespace-nowrap">
                    +{guild.specializations.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{guild.member_count || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Target className="w-4 h-4" />
                  <span>{guild.quest_count || 0}</span>
                </div>
              </div>
              
              {isMember ? (
                <Badge className="bg-green-50 text-green-700 border-green-200 border text-xs whitespace-nowrap">
                  <Star className="w-3 h-3 mr-1" />
                  Member
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleJoinGuild(guild); }}
                  className="bg-violet-100 hover:bg-violet-200 text-violet-600 border border-violet-300 whitespace-nowrap"
                >
                  Join
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="creator-card p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              Guilds
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Join collaborative communities and tackle quests together
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{guilds.length} Active Guilds</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-violet-500/25 transition-all duration-300">
              <Plus className="w-5 h-5 mr-2" />
              Create Guild
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="creator-card p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search guilds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-gray-100/50 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl"
          />
        </div>
      </div>

      {/* Default Guilds - Single Column Layout */}
      {defaultGuilds.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Crown className="w-7 h-7 text-violet-500" />
            Official Communities ({defaultGuilds.length})
          </h2>
          <div className="space-y-6">
            {defaultGuilds.map((guild, index) => (
              <Link key={guild.id} to={createPageUrl("GuildDetail") + `?id=${guild.id}`}>
                {renderGuildCard(guild, index)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Custom Guilds - Single Column Layout */}
      {customGuilds.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" />
            Community Guilds ({customGuilds.length})
          </h2>
          <div className="space-y-6">
             {customGuilds.map((guild, index) => (
              <Link key={guild.id} to={createPageUrl("GuildDetail") + `?id=${guild.id}`}>
                {renderGuildCard(guild, index)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="creator-card h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          filteredGuilds.length === 0 && (
            <div className="creator-card p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchTerm ? "No guilds found" : "No guilds yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Be the first to create a guild and start collaborating"
                }
              </p>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Guild
              </Button>
            </div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
