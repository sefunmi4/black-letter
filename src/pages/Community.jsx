import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuildsView from "../components/community/GuildsView";
import MatchmakingView from "../components/community/MatchmakingView";
import { Users, UserSearch } from 'lucide-react';

export default function Community() {
  const [activeTab, setActiveTab] = useState('guilds');

  useEffect(() => {
    // Check URL params for tab selection
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'matchmaking') {
      setActiveTab('matchmaking');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto bg-gray-100 h-12 rounded-xl p-1">
            <TabsTrigger value="guilds" className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg h-full">
              <Users className="w-5 h-5 mr-2" />
              Guilds
            </TabsTrigger>
            <TabsTrigger value="matchmaking" className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-lg h-full">
              <UserSearch className="w-5 h-5 mr-2" />
              Find Teammates
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guilds" className="mt-6">
            <GuildsView />
          </TabsContent>
          <TabsContent value="matchmaking" className="mt-6">
            <MatchmakingView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}